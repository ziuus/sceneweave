export type InputType = 'panorama' | 'photo' | 'demo';

export interface CapturedInput {
  type: InputType;
  data: string; // base64 data URL or blob URL
  width?: number;
  height?: number;
  metadata?: {
    isEquirectangular?: boolean;
    fov?: number;
    deviceOrientation?: DeviceOrientationEvent['alpha'] | null;
  };
}

export interface Surface {
  id: string;
  type: 'floor' | 'wall' | 'ceiling' | 'window' | 'door';
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number]; // width, height
  material: {
    color: string;
    roughness: number;
    metalness: number;
    emissive?: string;
    emissiveIntensity?: number;
    map?: string; // texture reference
  };
}

export interface DetectedObject {
  id: string;
  type: string;
  category: 'furniture' | 'decor' | 'tech' | 'lighting' | 'storage' | 'other';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  confidence: number;
  attributes?: Record<string, unknown>;
}

export interface LightingInfo {
  type: 'natural' | 'artificial' | 'mixed';
  colorTemperature: number; // Kelvin
  intensity: number; // 0-1
  direction?: [number, number, number];
  sources: Array<{
    type: 'window' | 'lamp' | 'ceiling' | 'screen';
    position: [number, number, number];
    intensity: number;
    color: string;
  }>;
}

export interface SceneAnalysis {
  id: string;
  inputType: InputType;
  roomType: 'office' | 'bedroom' | 'living' | 'studio' | 'kitchen' | 'unknown';
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  surfaces: Surface[];
  objects: DetectedObject[];
  lighting: LightingInfo;
  colorPalette: string[];
  spatialFeatures: {
    hasDesk: boolean;
    hasChair: boolean;
    hasWindow: boolean;
    hasMonitor: boolean;
    hasWhiteboard: boolean;
    focalPoint?: [number, number, number]; // primary workspace area
  };
  confidence: number;
  processingTime: number;
  metadata: {
    originalImageWidth: number;
    originalImageHeight: number;
    analysisVersion: string;
  };
}

export interface EnvironmentModifications {
  lighting: {
    ambientIntensity: number;
    ambientColor: string;
    keyLightIntensity: number;
    keyLightColor: string;
    keyLightPosition: [number, number, number];
    accentLights: Array<{
      position: [number, number, number];
      color: string;
      intensity: number;
      type: 'spot' | 'point' | 'rect';
    }>;
    fog?: {
      color: string;
      density: number;
    };
  };
  materials: Array<{
    objectId: string;
    emissive?: string;
    emissiveIntensity?: number;
    opacity?: number;
    color?: string;
  }>;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    transitionDuration: number;
  };
  effects: {
    vignette: number;
    bloom: number;
    chromaticAberration: number;
  };
}

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  transitionDuration: number;
}