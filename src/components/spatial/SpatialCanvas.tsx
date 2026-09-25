'use client';

import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows, 
  Html, 
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { SceneAnalysis, Surface, DetectedObject, EnvironmentModifications, CameraPreset, CapturedInput } from '@/lib/scene/types';
import { WidgetConfig } from '@/lib/workspace/types';
import { widgetComponents } from '@/components/workspace/WorkspaceRenderer';
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

function SurfaceMesh({ surface, materialOverrides, hasPanorama }: { surface: Surface; materialOverrides?: Partial<THREE.MeshStandardMaterialParameters>; hasPanorama?: boolean }) {
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
  
  if (hasPanorama) {
    if (surface.type === 'floor') {
      return (
        <mesh position={surface.position} rotation={surface.rotation} receiveShadow>
          <primitive object={geometry} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      );
    }
    return null;
  }

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

function ProceduralObject({ object, materialOverrides, onClick, hasPanorama }: { 
  object: DetectedObject; 
  materialOverrides?: Partial<THREE.MeshStandardMaterialParameters>;
  onClick?: () => void;
  hasPanorama?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const colorConfig = OBJECT_COLORS[object.type] || { color: '#2a2a2a' };
  
  const material = useMemo(() => {
    if (hasPanorama) {
      const baseMat = new THREE.MeshStandardMaterial({
        color: colorConfig.color,
        transparent: true,
        opacity: 0.35, // subtle transparency
        depthWrite: false,
        roughness: 0.8,
        metalness: 0.1,
        wireframe: false, // Solid materials as requested
        ...materialOverrides,
      });
      if (materialOverrides?.emissive || colorConfig.emissive) {
        baseMat.emissive = new THREE.Color(materialOverrides?.emissive || colorConfig.emissive);
      }
      return baseMat;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: colorConfig.color,
      roughness: colorConfig.roughness ?? 0.7,
      metalness: colorConfig.metalness ?? 0.1,
      ...materialOverrides,
    });
    if (colorConfig.emissive) {
      mat.emissive = new THREE.Color(colorConfig.emissive);
      mat.emissiveIntensity = 0;
    }
    return mat;
  }, [colorConfig, materialOverrides, hasPanorama]);

  useFrame(() => {
    if (materialOverrides?.emissiveIntensity !== undefined && material.emissive) {
      material.emissiveIntensity = materialOverrides.emissiveIntensity;
    }
  });

  const renderDetailedObject = () => {
    switch (object.type) {
      case 'bed':
        return (
          <>
            <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
              <boxGeometry args={[1, 0.5, 1]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#5c3a21" roughness={0.7} />}
            </mesh>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[0.95, 0.2, 0.95]} />
            </mesh>
            <mesh position={[0, 0.25, -0.35]} castShadow receiveShadow>
              <boxGeometry args={[0.6, 0.1, 0.2]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#ffffff" roughness={0.9} />}
            </mesh>
          </>
        );
      case 'desk':
      case 'table':
        return (
          <>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 0.1, 1]} />
            </mesh>
            <mesh position={[-0.45, -0.05, -0.45]} castShadow receiveShadow material={material}>
              <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
            </mesh>
            <mesh position={[0.45, -0.05, -0.45]} castShadow receiveShadow material={material}>
              <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
            </mesh>
            <mesh position={[-0.45, -0.05, 0.45]} castShadow receiveShadow material={material}>
              <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
            </mesh>
            <mesh position={[0.45, -0.05, 0.45]} castShadow receiveShadow material={material}>
              <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
            </mesh>
          </>
        );
      case 'wardrobe':
      case 'almirah':
      case 'cupboard':
        return (
          <>
            <mesh position={[0, 0, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
            <mesh position={[-0.25, 0, 0.505]} castShadow receiveShadow>
              <boxGeometry args={[0.48, 0.96, 0.01]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color={colorConfig.color} roughness={0.8} />}
            </mesh>
            <mesh position={[0.25, 0, 0.505]} castShadow receiveShadow>
              <boxGeometry args={[0.48, 0.96, 0.01]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color={colorConfig.color} roughness={0.8} />}
            </mesh>
            <mesh position={[-0.05, 0, 0.52]} castShadow receiveShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />}
            </mesh>
            <mesh position={[0.05, 0, 0.52]} castShadow receiveShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />}
            </mesh>
          </>
        );
      case 'chair':
      case 'office-chair':
        return (
          <>
            <mesh position={[0, -0.1, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[0.8, 0.1, 0.8]} />
            </mesh>
            <mesh position={[0, 0.25, -0.35]} castShadow receiveShadow material={material}>
              <boxGeometry args={[0.8, 0.6, 0.1]} />
            </mesh>
            <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.4, 8]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />}
            </mesh>
            <mesh position={[0, -0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.9, 0.1, 0.1]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />}
            </mesh>
            <mesh position={[0, -0.45, 0]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.9, 0.1, 0.1]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />}
            </mesh>
          </>
        );
      case 'laptop':
        return (
          <>
            <mesh position={[0, -0.45, 0.1]} castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 0.1, 0.8]} />
            </mesh>
            <mesh position={[0, -0.05, -0.25]} rotation={[0.2, 0, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 0.8, 0.05]} />
            </mesh>
            <mesh position={[0, -0.05, -0.22]} rotation={[0.2, 0, 0]}>
              <planeGeometry args={[0.9, 0.7]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#000" emissive={colorConfig.emissive || "#38bdf8"} emissiveIntensity={materialOverrides?.emissiveIntensity || 1} />}
            </mesh>
          </>
        );
      case 'monitor':
      case 'tv':
        return (
          <>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 0.8, 0.1]} />
            </mesh>
            <mesh position={[0, 0.1, 0.055]}>
              <planeGeometry args={[0.95, 0.75]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#000" emissive={colorConfig.emissive || "#38bdf8"} emissiveIntensity={materialOverrides?.emissiveIntensity || 1} />}
            </mesh>
            <mesh position={[0, -0.2, -0.05]} castShadow receiveShadow material={material}>
              <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
            </mesh>
            <mesh position={[0, -0.45, -0.05]} castShadow receiveShadow material={material}>
              <boxGeometry args={[0.4, 0.05, 0.3]} />
            </mesh>
          </>
        );
      case 'window':
        return (
          <>
            <mesh castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
            <mesh position={[0, 0, 0.51]}>
              <planeGeometry args={[0.9, 0.9]} />
              {hasPanorama ? <primitive object={material} attach="material" /> : <meshStandardMaterial color="#bae6fd" transparent opacity={0.4} roughness={0.1} />}
            </mesh>
          </>
        );
      case 'fan':
      case 'ceiling-fan':
        return (
          <>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow material={material}>
              <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
            </mesh>
            <mesh position={[0, 0.05, 0]} castShadow receiveShadow material={material}>
              <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
            </mesh>
            <mesh position={[0, 0.05, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 0.02, 0.15]} />
            </mesh>
            <mesh position={[0, 0.05, 0]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow material={material}>
              <boxGeometry args={[1, 0.02, 0.15]} />
            </mesh>
          </>
        );
      default:
        return (
          <mesh castShadow receiveShadow material={material}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={groupRef}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onPointerOver={() => { setHovered(true); hapticFeedback('selection'); }}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {renderDetailedObject()}
      {hovered && (
        <mesh>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial color="#e94560" transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}
function Room({ 
  scene, 
  environmentMods,
  hasPanorama = false
}: { 
  scene: SceneAnalysis; 
  environmentMods?: EnvironmentModifications;
  hasPanorama?: boolean;
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
            hasPanorama={hasPanorama}
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
            hasPanorama={hasPanorama}
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
function PanoramaBackground({ capturedInput, ambientIntensity = 1 }: { capturedInput?: CapturedInput, ambientIntensity?: number }) {
  if (!capturedInput || capturedInput.type === 'demo') return null;
  const texture = useLoader(THREE.TextureLoader, capturedInput.data);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  const tint = new THREE.Color().setScalar(Math.max(0.2, ambientIntensity));
  
  if (capturedInput.type === 'panorama') {
    return (
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[100, 64, 64]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} color={tint} />
      </mesh>
    );
  }
  
  const aspect = (capturedInput.width || 1600) / (capturedInput.height || 900);
  return (
    <mesh position={[0, 1.5, -10]}>
      <planeGeometry args={[20 * aspect, 20]} />
      <meshBasicMaterial map={texture} color={tint} />
    </mesh>
  );
}

interface SpatialCanvasProps {
  scene: SceneAnalysis;
  capturedInput?: CapturedInput;
  environmentMods?: EnvironmentModifications;
  cameraPreset?: CameraPreset;
  widgets?: WidgetConfig[];
  isTransitioning?: boolean;
  onTransitionComplete?: () => void;
  className?: string;
}

function SpatialCanvasInner({ 
  scene,
  capturedInput,
  environmentMods, 
  cameraPreset,
  widgets = [],
  isTransitioning = false,
  onTransitionComplete,
  className = ''
}: SpatialCanvasProps) {
  const mobile = isMobile();
  
  const defaultCamera: CameraPreset = useMemo(() => ({
    position: [0, 1.6, 0.1] as [number, number, number],
    target: [0, 1.2, -2] as [number, number, number],
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
          <PanoramaBackground capturedInput={capturedInput} ambientIntensity={environmentMods?.lighting?.ambientIntensity} />
          <Environment 
            preset="warehouse" 
            background={false} 
            resolution={256}
          />
        </Suspense>
        
        <Room scene={scene} environmentMods={environmentMods} hasPanorama={capturedInput?.type !== 'demo'} />
        
        
        {widgets.filter(w => w.position === 'spatial' || w.position === 'floating').map(widget => {
          const Component = widgetComponents[widget.type];
          if (!Component || !widget.visible) return null;
          
          let anchorPos = [0, 1.5, -2];
          if (widget.anchor) {
            const obj = scene.objects.find(o => o.id === widget.anchor) || 
                        scene.objects.find(o => o.type === widget.anchor) ||
                        scene.surfaces.find(s => s.id === widget.anchor);
            if (obj) {
              anchorPos = obj.position;
            }
          }
          
          const offset = widget.anchorOffset || [0, 0, 0];
          const pos = [anchorPos[0] + offset[0], anchorPos[1] + offset[1], anchorPos[2] + offset[2]];
          
          return (
            <Html key={widget.id} position={pos as [number, number, number]} center transform={widget.position === 'spatial'} distanceFactor={widget.position === 'spatial' ? 3 : undefined} zIndexRange={[100, 0]}>
              <div className="pointer-events-auto origin-center">
                <Component {...widget.props} />
              </div>
            </Html>
          );
        })}

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
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI - 0.1}
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