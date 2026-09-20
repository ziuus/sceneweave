import { SceneAnalysis, Surface, DetectedObject, LightingInfo } from './types';

export const DEMO_SCENE_ANALYSIS: SceneAnalysis = {
  id: 'demo-scene-001',
  inputType: 'panorama',
  roomType: 'office',
  dimensions: {
    width: 4.5,
    depth: 5.5,
    height: 2.8,
  },
  surfaces: [
    {
      id: 'floor',
      type: 'floor',
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
      dimensions: [5, 6],
      material: {
        color: '#1a1a2e',
        roughness: 0.8,
        metalness: 0.1,
      },
    },
    {
      id: 'wall-back',
      type: 'wall',
      position: [0, 1.4, -2.75],
      rotation: [0, 0, 0],
      dimensions: [5, 2.8],
      material: {
        color: '#16213e',
        roughness: 0.9,
        metalness: 0.05,
      },
    },
    {
      id: 'wall-left',
      type: 'wall',
      position: [-2.5, 1.4, 0],
      rotation: [0, Math.PI / 2, 0],
      dimensions: [5.5, 2.8],
      material: {
        color: '#16213e',
        roughness: 0.9,
        metalness: 0.05,
      },
    },
    {
      id: 'wall-right',
      type: 'wall',
      position: [2.5, 1.4, 0],
      rotation: [0, -Math.PI / 2, 0],
      dimensions: [5.5, 2.8],
      material: {
        color: '#16213e',
        roughness: 0.9,
        metalness: 0.05,
      },
    },
    {
      id: 'wall-front',
      type: 'wall',
      position: [0, 1.4, 2.75],
      rotation: [0, Math.PI, 0],
      dimensions: [5, 2.8],
      material: {
        color: '#16213e',
        roughness: 0.9,
        metalness: 0.05,
      },
    },
    {
      id: 'window',
      type: 'window',
      position: [0, 1.6, -2.7],
      rotation: [0, 0, 0],
      dimensions: [2.5, 1.5],
      material: {
        color: '#0f3460',
        roughness: 0.1,
        metalness: 0.9,
        emissive: '#4a90d9',
        emissiveIntensity: 0.3,
      },
    },
    {
      id: 'ceiling',
      type: 'ceiling',
      position: [0, 2.8, 0],
      rotation: [Math.PI / 2, 0, 0],
      dimensions: [5, 6],
      material: {
        color: '#0d0d1a',
        roughness: 0.95,
        metalness: 0.0,
      },
    },
  ],
  objects: [
    {
      id: 'desk',
      type: 'desk',
      category: 'furniture',
      position: [0, 0.72, -0.5],
      rotation: [0, 0, 0],
      scale: [1.6, 0.75, 0.8],
      boundingBox: {
        min: [-0.8, 0, -0.9],
        max: [0.8, 0.75, 0.9],
      },
      confidence: 0.95,
      attributes: { hasDrawers: true, material: 'wood' },
    },
    {
      id: 'chair',
      type: 'office-chair',
      category: 'furniture',
      position: [0, 0.5, 1.2],
      rotation: [0, Math.PI, 0],
      scale: [0.6, 1.1, 0.6],
      boundingBox: {
        min: [-0.3, 0, -0.3],
        max: [0.3, 1.1, 0.3],
      },
      confidence: 0.92,
      attributes: { hasWheels: true, adjustable: true },
    },
    {
      id: 'monitor',
      type: 'monitor',
      category: 'tech',
      position: [0, 1.3, -1.1],
      rotation: [0, 0, 0],
      scale: [0.7, 0.45, 0.08],
      boundingBox: {
        min: [-0.35, 1.05, -1.14],
        max: [0.35, 1.5, -1.06],
      },
      confidence: 0.98,
      attributes: { isOn: true, aspectRatio: '16:9' },
    },
    {
      id: 'laptop',
      type: 'laptop',
      category: 'tech',
      position: [-0.5, 0.85, -0.3],
      rotation: [0, 0, 0],
      scale: [0.35, 0.02, 0.25],
      boundingBox: {
        min: [-0.675, 0.84, -0.425],
        max: [-0.325, 0.86, -0.175],
      },
      confidence: 0.88,
      attributes: { isOpen: true },
    },
    {
      id: 'lamp',
      type: 'desk-lamp',
      category: 'lighting',
      position: [1.1, 1.5, -1.0],
      rotation: [0, 0, 0],
      scale: [0.15, 0.6, 0.15],
      boundingBox: {
        min: [1.0, 0.9, -1.1],
        max: [1.2, 2.1, -0.9],
      },
      confidence: 0.9,
      attributes: { isOn: true, colorTemp: 3000 },
    },
    {
      id: 'plant',
      type: 'plant',
      category: 'decor',
      position: [-1.8, 0, -2.0],
      rotation: [0, 0, 0],
      scale: [0.4, 1.2, 0.4],
      boundingBox: {
        min: [-2.0, 0, -2.2],
        max: [-1.6, 1.2, -1.8],
      },
      confidence: 0.85,
      attributes: { type: 'snake-plant' },
    },
    {
      id: 'bookshelf',
      type: 'bookshelf',
      category: 'storage',
      position: [2.0, 1.1, 1.5],
      rotation: [0, -Math.PI / 2, 0],
      scale: [0.8, 2.0, 0.3],
      boundingBox: {
        min: [1.7, 0.1, 1.2],
        max: [2.3, 2.1, 1.8],
      },
      confidence: 0.8,
      attributes: { shelves: 5, hasBooks: true },
    },
    {
      id: 'whiteboard',
      type: 'whiteboard',
      category: 'other',
      position: [-2.0, 1.4, 0.5],
      rotation: [0, Math.PI / 2, 0],
      scale: [1.2, 0.9, 0.05],
      boundingBox: {
        min: [-2.0, 0.9, 0.475],
        max: [-0.8, 1.9, 0.525],
      },
      confidence: 0.75,
      attributes: { isClean: true },
    },
    {
      id: 'keyboard',
      type: 'keyboard',
      category: 'tech',
      position: [0.1, 0.78, 0.1],
      rotation: [0, 0, 0],
      scale: [0.4, 0.02, 0.15],
      boundingBox: {
        min: [-0.1, 0.77, 0.025],
        max: [0.3, 0.79, 0.175],
      },
      confidence: 0.82,
      attributes: { isMechanical: true },
    },
    {
      id: 'mouse',
      type: 'mouse',
      category: 'tech',
      position: [0.5, 0.77, 0.05],
      rotation: [0, 0, 0],
      scale: [0.1, 0.03, 0.06],
      boundingBox: {
        min: [0.45, 0.76, 0.02],
        max: [0.55, 0.79, 0.08],
      },
      confidence: 0.78,
      attributes: {},
    },
    {
      id: 'coffee',
      type: 'coffee-mug',
      category: 'other',
      position: [-0.8, 0.85, -0.5],
      rotation: [0, 0, 0],
      scale: [0.1, 0.12, 0.1],
      boundingBox: {
        min: [-0.85, 0.8, -0.55],
        max: [-0.75, 0.92, -0.45],
      },
      confidence: 0.7,
      attributes: { hasLiquid: true },
    },
  ],
  lighting: {
    type: 'mixed',
    colorTemperature: 4200,
    intensity: 0.6,
    direction: [0, -1, -0.5],
    sources: [
      {
        type: 'window',
        position: [0, 1.8, -2.7],
        intensity: 0.8,
        color: '#87ceeb',
      },
      {
        type: 'lamp',
        position: [1.1, 2.0, -1.0],
        intensity: 0.6,
        color: '#ffd700',
      },
      {
        type: 'screen',
        position: [0, 1.3, -1.1],
        intensity: 0.4,
        color: '#64b5f6',
      },
      {
        type: 'ceiling',
        position: [0, 2.6, 0],
        intensity: 0.3,
        color: '#f5f5f5',
      },
    ],
  },
  colorPalette: [
    '#0a0a0f',
    '#1a1a2e',
    '#16213e',
    '#0f3460',
    '#e94560',
    '#00d4aa',
    '#ffd700',
    '#87ceeb',
  ],
  spatialFeatures: {
    hasDesk: true,
    hasChair: true,
    hasWindow: true,
    hasMonitor: true,
    hasWhiteboard: true,
    focalPoint: [0, 0.8, -0.5],
  },
  confidence: 0.87,
  processingTime: 1200,
  metadata: {
    originalImageWidth: 4096,
    originalImageHeight: 2048,
    analysisVersion: '1.0.0',
  },
};

export function getDemoSceneAnalysis(): SceneAnalysis {
  return DEMO_SCENE_ANALYSIS;
}

export function createDemoPanoramaDataUrl(): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return '';
  
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0a0a0f');
  gradient.addColorStop(0.3, '#16213e');
  gradient.addColorStop(0.5, '#1a1a2e');
  gradient.addColorStop(0.7, '#0f3460');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#e94560';
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  ctx.fillStyle = '#00d4aa';
  ctx.font = 'bold 48px Space Grotesk';
  ctx.textAlign = 'center';
  ctx.fillText('SCENEWEAVE', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '24px Inter';
  ctx.fillStyle = '#a0a0b8';
  ctx.fillText('Demo Panorama', canvas.width / 2, canvas.height / 2 + 30);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}