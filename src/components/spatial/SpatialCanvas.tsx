'use client';

import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows, 
  Html, 
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { SceneAnalysis, Surface, DetectedObject, EnvironmentModifications, CameraPreset } from '@/lib/scene/types';
import { useApp } from '@/lib/store/AppContext';
import { isMobile, hapticFeedback } from '@/lib/utils/mobile';
import { lerp, lerpVec3, easeInOutCubic } from '@/lib/utils/transitions';

const ROOM_COLORS = {
  floor: '#1a1a2e',
  wall: '#16213e',
  ceiling: '#0d0d1a',
  window: '#0f3460',
  windowGlow: '#4a90d9',
};

const OBJECT_COLORS: Record<string, { color: string; emissive?: string }> = {
  desk: { color: '#2a1a1a', emissive: '#e94560' },
  'office-chair': { color: '#1a1a1a' },
  monitor: { color: '#0d1a2a', emissive: '#64b5f6' },
  laptop: { color: '#1a1a1a' },
  'desk-lamp': { color: '#2a2a1a', emissive: '#ffd700' },
  plant: { color: '#1a2a1a' },
  bookshelf: { color: '#1a1a1a' },
  whiteboard: { color: '#001515', emissive: '#00d4aa' },
  keyboard: { color: '#1a1a1a' },
  mouse: { color: '#1a1a1a' },
  'coffee-mug': { color: '#2a1a1a' },
};

function SurfaceMesh({ surface, materialOverrides }: { surface: Surface; materialOverrides?: Partial<THREE.MeshStandardMaterialParameters> }) {
  const [width, height] = surface.dimensions;
  const geometry = useMemo(() => new THREE.PlaneGeometry(width, height, 1, 1), [width, height]);
  
  const material = useMemo(() => {
    const baseMaterial: THREE.MeshStandardMaterialParameters = {
      color: surface.material.color,
      roughness: surface.material.roughness,
      metalness: surface.material.metalness,
      side: THREE.DoubleSide,
    };
    
    if (surface.material.emissive) {
      baseMaterial.emissive = new THREE.Color(surface.material.emissive);
      baseMaterial.emissiveIntensity = surface.material.emissiveIntensity || 0;
    }
    
    return new THREE.MeshStandardMaterial({ ...baseMaterial, ...materialOverrides });
  }, [surface.material.color, surface.material.roughness, surface.material.metalness, surface.material.emissive, surface.material.emissiveIntensity, materialOverrides]);
  
  return (
    <mesh
      position={surface.position}
      rotation={surface.rotation}
      receiveShadow
      castShadow={surface.type !== 'floor'}
    >
      <primitive object={geometry} />
      <primitive object={material} />
    </mesh>
  );
}

function ProceduralObject({ object, materialOverrides, onClick }: { 
  object: DetectedObject; 
  materialOverrides?: Partial<THREE.MeshStandardMaterialParameters>;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const colorConfig = OBJECT_COLORS[object.type] || { color: '#2a2a2a' };
  
  const geometry = useMemo(() => {
    switch (object.type) {
      case 'desk':
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
      case 'office-chair':
        return new THREE.CylinderGeometry(object.scale[0], object.scale[0] * 0.8, object.scale[1], 8);
      case 'monitor':
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
      case 'laptop':
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
      case 'desk-lamp':
        return new THREE.CylinderGeometry(object.scale[0], object.scale[0] * 0.5, object.scale[1], 6);
      case 'plant':
        return new THREE.ConeGeometry(object.scale[0], object.scale[1], 6);
      case 'bookshelf':
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
      case 'whiteboard':
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
      case 'keyboard':
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
      case 'mouse':
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
      case 'coffee-mug':
        return new THREE.CylinderGeometry(object.scale[0], object.scale[0], object.scale[1], 8);
      default:
        return new THREE.BoxGeometry(object.scale[0], object.scale[1], object.scale[2]);
    }
  }, [object.type, object.scale]);
  
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: colorConfig.color,
      roughness: 0.7,
      metalness: 0.1,
      ...materialOverrides,
    });
    
    if (colorConfig.emissive) {
      mat.emissive = new THREE.Color(colorConfig.emissive);
      mat.emissiveIntensity = 0;
    }
    
    return mat;
  }, [colorConfig, materialOverrides]);
  
  useFrame(() => {
    if (meshRef.current && materialOverrides?.emissiveIntensity !== undefined) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        mat.emissiveIntensity = materialOverrides.emissiveIntensity;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      castShadow
      receiveShadow
      onPointerOver={() => { setHovered(true); hapticFeedback('selection'); }}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <primitive object={geometry} />
      <primitive object={material} />
      {hovered && (
        <primitive object={new THREE.BoxGeometry(object.scale[0] * 1.02, object.scale[1] * 1.02, object.scale[2] * 1.02)} >
          <primitive object={new THREE.MeshBasicMaterial({ color: '#e94560', transparent: true, opacity: 0.1, side: THREE.BackSide })} />
        </primitive>
      )}
    </mesh>
  );
}

function Room({ 
  scene, 
  environmentMods 
}: { 
  scene: SceneAnalysis; 
  environmentMods?: EnvironmentModifications;
}) {
  return (
    <group>
      {scene.surfaces.map(surface => {
        const mod = environmentMods?.materials.find(m => m.objectId === surface.id);
        return (
          <SurfaceMesh
            key={surface.id}
            surface={surface}
            materialOverrides={mod ? { 
              color: mod.color, 
              emissive: mod.emissive ? new THREE.Color(mod.emissive) : undefined,
              emissiveIntensity: mod.emissiveIntensity,
              opacity: mod.opacity,
              transparent: mod.opacity !== undefined && mod.opacity < 1,
            } : undefined}
          />
        );
      })}
      
      {scene.objects.map(object => {
        const mod = environmentMods?.materials.find(m => m.objectId === object.id);
        return (
          <ProceduralObject
            key={object.id}
            object={object}
            materialOverrides={mod ? {
              color: mod.color,
              emissive: mod.emissive ? new THREE.Color(mod.emissive) : undefined,
              emissiveIntensity: mod.emissiveIntensity,
              opacity: mod.opacity,
              transparent: mod.opacity !== undefined && mod.opacity < 1,
            } : undefined}
          />
        );
      })}
    </group>
  );
}

function LightingSystem({ environment, scene }: { environment: EnvironmentModifications; scene: SceneAnalysis }) {
  const { lighting } = environment;
  const hasWindow = scene.spatialFeatures.hasWindow;
  
  const targetPos = lighting.keyLightPosition.map((v, i) => v + (i === 1 ? -1 : 0)) as [number, number, number];
  
  return (
    <group>
      <ambientLight color={lighting.ambientColor} intensity={lighting.ambientIntensity} />
      
      <directionalLight
        position={lighting.keyLightPosition}
        color={lighting.keyLightColor}
        intensity={lighting.keyLightIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-near={0.1}
        shadow-normalBias={0.02}
      >
        <group position={targetPos} />
      </directionalLight>
      
      {hasWindow && (
        <rectAreaLight
          position={[0, 1.8, -2.7]}
          color="#87ceeb"
          intensity={0.6}
          width={2.5}
          height={1.5}
        />
      )}
      
      {lighting.accentLights.map((light, index) => (
        <group key={index}>
          {light.type === 'spot' && (
            <spotLight
              position={light.position}
              color={light.color}
              intensity={light.intensity}
              angle={Math.PI / 6}
              penumbra={0.5}
              decay={2}
              castShadow
              shadow-mapSize-width={512}
              shadow-mapSize-height={512}
            >
              <group position={[light.position[0], light.position[1] - 1, light.position[2]]} />
            </spotLight>
          )}
          {light.type === 'point' && (
            <pointLight
              position={light.position}
              color={light.color}
              intensity={light.intensity}
              decay={2}
              distance={5}
            />
          )}
          {light.type === 'rect' && (
            <rectAreaLight
              position={light.position}
              color={light.color}
              intensity={light.intensity}
              width={1}
              height={0.6}
            />
          )}
        </group>
      ))}
      
      {lighting.fog && (
        <fog color={lighting.fog.color} attach="fog" args={[lighting.fog.color, lighting.fog.density]} />
      )}
    </group>
  );
}

function CameraController({ 
  cameraPreset, 
  isTransitioning,
  onTransitionComplete 
}: { 
  cameraPreset: CameraPreset; 
  isTransitioning: boolean;
  onTransitionComplete: () => void;
}) {
  const { camera, camera: threeCamera } = useThree();
  const startPos = useRef<[number, number, number]>([0, 0, 0]);
  const startTarget = useRef<[number, number, number]>([0, 0, 0]);
  const startFov = useRef(60);
  const progress = useRef(0);
  const transitioning = useRef(false);
  
  useFrame((state, delta) => {
    if (!isTransitioning) {
      if (transitioning.current) {
        transitioning.current = false;
        onTransitionComplete();
      }
      return;
    }
    
    if (!transitioning.current) {
      transitioning.current = true;
      startPos.current = [camera.position.x, camera.position.y, camera.position.z];
      const controls = (camera as any).controls;
      if (controls) {
        startTarget.current = [controls.target.x, controls.target.y, controls.target.z];
      }
      // Only access fov on PerspectiveCamera
      if ('fov' in camera) {
        startFov.current = (camera as THREE.PerspectiveCamera).fov;
      }
      progress.current = 0;
    }
    
    progress.current = Math.min(progress.current + delta / cameraPreset.transitionDuration, 1);
    const eased = easeInOutCubic(progress.current);
    
    camera.position.set(...lerpVec3(startPos.current, cameraPreset.position, eased));
    
    // Only update fov on PerspectiveCamera
    if ('fov' in camera) {
      (camera as THREE.PerspectiveCamera).fov = lerp(startFov.current, cameraPreset.fov, eased);
      camera.updateProjectionMatrix();
    }
    
    const controls = (camera as any).controls;
    if (controls) {
      controls.target.set(...lerpVec3(startTarget.current, cameraPreset.target, eased));
    }
  });
  
  return null;
}

interface SpatialCanvasProps {
  scene: SceneAnalysis;
  environmentMods?: EnvironmentModifications;
  cameraPreset?: CameraPreset;
  isTransitioning?: boolean;
  onTransitionComplete?: () => void;
  className?: string;
}

function SpatialCanvasInner({ 
  scene, 
  environmentMods, 
  cameraPreset,
  isTransitioning = false,
  onTransitionComplete,
  className = ''
}: SpatialCanvasProps) {
  const mobile = isMobile();
  
  const defaultCamera: CameraPreset = useMemo(() => ({
    position: [0, 1.5, 3.5],
    target: [0, 0.8, -0.5],
    fov: 60,
    transitionDuration: 1.5,
  }), []);
  
  const activeCamera = cameraPreset || defaultCamera;
  
  return (
    <div className={`relative w-full h-full ${className}`} style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: activeCamera.position, fov: activeCamera.fov }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        shadows={true}
        style={{ touchAction: 'none' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        
        <LightingSystem environment={environmentMods || {
          lighting: {
            ambientIntensity: 0.3,
            ambientColor: '#1a1a2e',
            keyLightIntensity: 0.8,
            keyLightColor: '#e94560',
            keyLightPosition: [0, 2, 2],
            accentLights: [],
          },
          materials: [],
          camera: activeCamera,
          effects: { vignette: 0.3, bloom: 0.1, chromaticAberration: 0 },
        }} scene={scene} />
        
        <Suspense fallback={null}>
          <Environment 
            preset="warehouse" 
            background={false} 
            resolution={256}
          />
        </Suspense>
        
        <Room scene={scene} environmentMods={environmentMods} />
        
        <ContactShadows 
          opacity={0.3} 
          scale={10} 
          blur={2} 
          far={5} 
          position={[0, 0.01, 0]} 
        />
        
        <CameraController 
          cameraPreset={activeCamera} 
          isTransitioning={isTransitioning}
          onTransitionComplete={onTransitionComplete || (() => {})}
        />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={1.5}
          maxDistance={mobile ? 6 : 8}
          target={[0, 0.8, -0.5]}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={1}
        />
        
        <Html
          fullscreen
          className="pointer-events-none"
          prepend
        >
          <div className="absolute inset-0 pointer-events-none" />
        </Html>
      </Canvas>
      
      <motion.div
        className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-64 text-center md:text-left pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.6, y: 0 }}
      >
        <p className="text-xs text-text-muted font-mono">
          {mobile ? 'Drag to orbit • Pinch to zoom' : 'Click & drag to orbit • Scroll to zoom • Right-click to pan'}
        </p>
      </motion.div>
    </div>
  );
}

function CanvasWrapper({ 
  scene, 
  environmentMods, 
  cameraPreset,
  isTransitioning,
  onTransitionComplete,
  className,
}: SpatialCanvasProps) {
  const [canvasReady, setCanvasReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setCanvasReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!canvasReady) {
    return (
      <div className={`relative ${className}`} style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary">
          <motion.div
            className="w-12 h-12 border-3 border-accent-primary/30 border-t-accent-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
    );
  }
  
  return (
    <SpatialCanvasInner
      scene={scene}
      environmentMods={environmentMods}
      cameraPreset={cameraPreset}
      isTransitioning={isTransitioning}
      onTransitionComplete={onTransitionComplete}
      className={className}
    />
  );
}

export { CanvasWrapper as SpatialCanvas };