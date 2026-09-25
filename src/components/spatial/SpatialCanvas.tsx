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

const OBJECT_COLORS: Record<string, { color: string; emissive?: string; roughness?: number; metalness?: number }> = {
  // Bedroom
  bed: { color: '#c85a2b', roughness: 0.85, metalness: 0.05 }, // Warm mattress / bed cover
  'bed-frame': { color: '#5c3a21', roughness: 0.7, metalness: 0.1 },
  wardrobe: { color: '#2b231d', roughness: 0.6, metalness: 0.15 }, // Dark wood/metal closet
  cupboard: { color: '#2b231d', roughness: 0.6, metalness: 0.15 },
  almirah: { color: '#26292b', roughness: 0.4, metalness: 0.35 },
  chair: { color: '#222222', roughness: 0.6, metalness: 0.3 },
  'office-chair': { color: '#1c1c1e', roughness: 0.7, metalness: 0.2 },
  table: { color: '#c68b59', roughness: 0.6, metalness: 0.05 }, // Warm study desk
  desk: { color: '#c68b59', roughness: 0.6, metalness: 0.05 },
  window: { color: '#e0f2fe', emissive: '#bae6fd', roughness: 0.1, metalness: 0.1 },
  fan: { color: '#e2e8f0', roughness: 0.5, metalness: 0.3 },
  'ceiling-fan': { color: '#e2e8f0', roughness: 0.5, metalness: 0.3 },
  // Electronics & accessories
  monitor: { color: '#0f172a', emissive: '#38bdf8', roughness: 0.2, metalness: 0.5 },
  laptop: { color: '#334155', emissive: '#38bdf8', roughness: 0.3, metalness: 0.6 },
  tv: { color: '#020617', emissive: '#60a5fa', roughness: 0.15, metalness: 0.7 },
  'desk-lamp': { color: '#fbbf24', emissive: '#f59e0b', roughness: 0.3, metalness: 0.4 },
  plant: { color: '#15803d', roughness: 0.9, metalness: 0.0 },
  bookshelf: { color: '#451a03', roughness: 0.8, metalness: 0.05 },
  whiteboard: { color: '#f8fafc', roughness: 0.2, metalness: 0.1 },
  sofa: { color: '#64748b', roughness: 0.9, metalness: 0.0 },
  couch: { color: '#64748b', roughness: 0.9, metalness: 0.0 },
  refrigerator: { color: '#cbd5e1', roughness: 0.3, metalness: 0.5 },
};

function SurfaceMesh({ surface, materialOverrides }: { surface: Surface; materialOverrides?: Partial<THREE.MeshStandardMaterialParameters> }) {
  const [width, height] = surface.dimensions;
  const geometry = useMemo(() => new THREE.PlaneGeometry(width, height, 1, 1), [width, height]);
  
  const material = useMemo(() => {
    const baseMaterial: THREE.MeshStandardMaterialParameters = {
      color: surface.material.color,
      roughness: surface.material.roughness,
      metalness: surface.material.metalness,
      side: THREE.FrontSide,
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
      // Bedroom & Living
      case 'bed':
        // Bed base / frame
        return new THREE.BoxGeometry(1, 1, 1);
      case 'wardrobe':
      case 'cupboard':
      case 'almirah':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'chair':
      case 'office-chair':
        return new THREE.CylinderGeometry(0.35, 0.3, 1, 12);
      case 'sofa':
      case 'couch':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'table':
      case 'desk':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'monitor':
      case 'tv':
        return new THREE.BoxGeometry(1, 1, 0.08);
      case 'laptop':
        return new THREE.BoxGeometry(1, 0.25, 0.8);
      case 'fan':
      case 'ceiling-fan':
        // A compact central hub with subtle rotor disc
        return new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16);
      case 'desk-lamp':
        return new THREE.CylinderGeometry(0.2, 0.35, 1, 8);
      case 'plant':
        return new THREE.ConeGeometry(0.4, 1, 8);
      case 'bookshelf':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'window':
        return new THREE.BoxGeometry(1, 1, 0.05);
      case 'whiteboard':
        return new THREE.BoxGeometry(1, 1, 0.04);
      case 'keyboard':
        return new THREE.BoxGeometry(1, 0.06, 0.4);
      case 'mouse':
        return new THREE.BoxGeometry(0.3, 0.1, 0.5);
      case 'coffee-mug':
        return new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [object.type]);
  
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
      <ambientLight color={lighting.ambientColor} intensity={Math.max(lighting.ambientIntensity, 0.6)} />
      
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
    position: [0, 1.6, 2.5] as [number, number, number],
    target: [0, 1.2, -3] as [number, number, number],
    fov: 70,
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
            ambientIntensity: 1.2,
            ambientColor: '#ffffff',
            keyLightIntensity: 1.5,
            keyLightColor: '#ffffff',
            keyLightPosition: [0, 4, 2],
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
          minDistance={0.5}
          maxDistance={mobile ? 6 : 8}
          target={[0, 1.2, -1]}
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