import fs from 'fs';
const content = fs.readFileSync('src/components/spatial/SpatialCanvas.tsx', 'utf8');

const newFunction = `function SurfaceMesh({ surface, materialOverrides, hasPanorama }: { surface: Surface; materialOverrides?: Partial<THREE.MeshStandardMaterialParameters>; hasPanorama?: boolean }) {
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
    return null; // hide walls/ceiling so we see panorama
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
}`;

let newContent = content.replace(/function SurfaceMesh\([\s\S]*?return \(\n    <mesh[\s\S]*?<\/mesh>\n  \);\n\}/, newFunction);
fs.writeFileSync('src/components/spatial/SpatialCanvas.tsx', newContent);
console.log('Done');
