import fs from 'fs';
const content = fs.readFileSync('src/components/spatial/SpatialCanvas.tsx', 'utf8');

const newMaterial = `  const material = useMemo(() => {
    if (hasPanorama) {
      return new THREE.MeshStandardMaterial({
        color: '#4a90e2',
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: true,
      });
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

let newContent = content.replace(/const material = useMemo\(\(\) => \{[\s\S]*?return mat;\n  \}, \[colorConfig, materialOverrides\]\);/, newMaterial);

// Replace hardcoded materials with dynamic based on hasPanorama
newContent = newContent.replace(/<meshStandardMaterial color="#5c3a21" roughness=\{0.7\} \/>/g, `{hasPanorama ? <primitive object={material} /> : <meshStandardMaterial color="#5c3a21" roughness={0.7} />}`);
newContent = newContent.replace(/<meshStandardMaterial color="#ffffff" roughness=\{0.9\} \/>/g, `{hasPanorama ? <primitive object={material} /> : <meshStandardMaterial color="#ffffff" roughness={0.9} />}`);
newContent = newContent.replace(/<meshStandardMaterial color=\{colorConfig.color\} roughness=\{0.8\} \/>/g, `{hasPanorama ? <primitive object={material} /> : <meshStandardMaterial color={colorConfig.color} roughness={0.8} />}`);
newContent = newContent.replace(/<meshStandardMaterial color="#aaaaaa" metalness=\{0.8\} roughness=\{0.2\} \/>/g, `{hasPanorama ? <primitive object={material} /> : <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />}`);
newContent = newContent.replace(/<meshStandardMaterial color="#222" metalness=\{0.5\} roughness=\{0.5\} \/>/g, `{hasPanorama ? <primitive object={material} /> : <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />}`);
newContent = newContent.replace(/<meshStandardMaterial color="#000" emissive=\{colorConfig.emissive \|\| "#38bdf8"\} emissiveIntensity=\{materialOverrides\?.emissiveIntensity \|\| 1\} \/>/g, `{hasPanorama ? <primitive object={material} /> : <meshStandardMaterial color="#000" emissive={colorConfig.emissive || "#38bdf8"} emissiveIntensity={materialOverrides?.emissiveIntensity || 1} />}`);
newContent = newContent.replace(/<meshStandardMaterial color="#bae6fd" transparent opacity=\{0.4\} roughness=\{0.1\} \/>/g, `{hasPanorama ? <primitive object={material} /> : <meshStandardMaterial color="#bae6fd" transparent opacity={0.4} roughness={0.1} />}`);

fs.writeFileSync('src/components/spatial/SpatialCanvas.tsx', newContent);
console.log('Holographic applied');
