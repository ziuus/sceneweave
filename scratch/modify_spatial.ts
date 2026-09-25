import fs from 'fs';

const content = fs.readFileSync('src/components/spatial/SpatialCanvas.tsx', 'utf8');

let newContent = content.replace(
  /function Room\(\{ \n  scene, \n  environmentMods \n\}: \{ \n  scene: SceneAnalysis; \n  environmentMods\?: EnvironmentModifications;\n\}\) \{/g,
  `function Room({ 
  scene, 
  environmentMods,
  hasPanorama = false
}: { 
  scene: SceneAnalysis; 
  environmentMods?: EnvironmentModifications;
  hasPanorama?: boolean;
}) {`
);

newContent = newContent.replace(
  /<SurfaceMesh\n            key={surface.id}\n            surface={surface}\n            materialOverrides={mod \? \{ \n              color: mod.color, \n              emissive: mod.emissive \? new THREE.Color\(mod.emissive\) : undefined,\n              emissiveIntensity: mod.emissiveIntensity,\n              opacity: mod.opacity,\n              transparent: mod.opacity !== undefined && mod.opacity < 1,\n            \} : undefined}\n          \/>/g,
  `<SurfaceMesh
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
          />`
);

newContent = newContent.replace(
  /<ProceduralObject\n            key={object.id}\n            object={object}\n            materialOverrides={mod \? \{\n              color: mod.color,\n              emissive: mod.emissive \? new THREE.Color\(mod.emissive\) : undefined,\n              emissiveIntensity: mod.emissiveIntensity,\n              opacity: mod.opacity,\n              transparent: mod.opacity !== undefined && mod.opacity < 1,\n            \} : undefined}\n          \/>/g,
  `<ProceduralObject
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
          />`
);

newContent = newContent.replace(
  /function SurfaceMesh\(\{ surface, materialOverrides \}: \{ surface: Surface; materialOverrides\?: Partial<THREE.MeshStandardMaterialParameters> \}\) \{/g,
  `function SurfaceMesh({ surface, materialOverrides, hasPanorama }: { surface: Surface; materialOverrides?: Partial<THREE.MeshStandardMaterialParameters>; hasPanorama?: boolean }) {`
);

newContent = newContent.replace(
  /function ProceduralObject\(\{ object, materialOverrides, onClick \}: \{ \n  object: DetectedObject; \n  materialOverrides\?: Partial<THREE.MeshStandardMaterialParameters>;\n  onClick\?: \(\) => void;\n\}\) \{/g,
  `function ProceduralObject({ object, materialOverrides, onClick, hasPanorama }: { 
  object: DetectedObject; 
  materialOverrides?: Partial<THREE.MeshStandardMaterialParameters>;
  onClick?: () => void;
  hasPanorama?: boolean;
}) {`
);

newContent = newContent.replace(
  /<Room scene=\{scene\} environmentMods=\{environmentMods\} \/>/g,
  `<Room scene={scene} environmentMods={environmentMods} hasPanorama={capturedInput?.type === 'file'} />`
);

fs.writeFileSync('src/components/spatial/SpatialCanvas.tsx', newContent);
console.log('Modifications applied');
