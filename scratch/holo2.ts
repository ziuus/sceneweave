import fs from 'fs';
const content = fs.readFileSync('src/components/spatial/SpatialCanvas.tsx', 'utf8');

const newMaterial = `  const material = useMemo(() => {
    if (hasPanorama) {
      const baseMat = new THREE.MeshStandardMaterial({
        color: '#4a90e2',
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: true,
        ...materialOverrides,
      });
      if (materialOverrides?.emissive) {
        baseMat.emissive = new THREE.Color(materialOverrides.emissive);
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
  }, [colorConfig, materialOverrides, hasPanorama]);`;

let newContent = content.replace(/const material = useMemo\(\(\) => \{\n    if \(hasPanorama\) \{[\s\S]*?return mat;\n  \}, \[colorConfig, materialOverrides, hasPanorama\]\);/, newMaterial);
fs.writeFileSync('src/components/spatial/SpatialCanvas.tsx', newContent);
console.log('Fixed material overrides for holo');
