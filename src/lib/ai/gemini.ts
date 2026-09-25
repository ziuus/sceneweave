import { GoogleGenerativeAI } from '@google/generative-ai';
import { SceneAnalysis, Surface, DetectedObject, LightingInfo, InputType } from '@/lib/scene/types';
import { WorkspaceConfig } from '@/lib/workspace/types';
import { generateWorkspaceConfig } from '@/lib/workspace/generators';
import { mockAIProvider } from './mock';

type AIInputType = InputType;

const GEMINI_MODEL = 'gemini-1.5-flash';

const SCENE_ANALYSIS_PROMPT = `You are a spatial AI that analyzes interior photos/panoramas and returns a detailed structured scene understanding.

Analyze the provided image and return a JSON object with this exact structure:

{
  "roomType": "office|bedroom|living|studio|kitchen|unknown",
  "dimensions": { "width": number, "depth": number, "height": number },
  "surfaces": [
    { "id": "floor", "type": "floor", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { "color": "hex", "roughness": 0-1, "metalness": 0-1 } },
    { "id": "wall-back", "type": "wall", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { ... } },
    { "id": "wall-left", "type": "wall", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { ... } },
    { "id": "wall-right", "type": "wall", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { ... } },
    { "id": "wall-front", "type": "wall", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { ... } },
    { "id": "ceiling", "type": "ceiling", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { ... } },
    { "id": "window", "type": "window", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { "color": "hex", "roughness": 0.1, "metalness": 0.9, "emissive": "hex", "emissiveIntensity": 0-1 } }
  ],
  "objects": [
    { "id": "desk", "type": "desk", "category": "furniture", "position": [x,y,z], "rotation": [rx,ry,rz], "scale": [x,y,z], "boundingBox": { "min": [x,y,z], "max": [x,y,z] }, "confidence": 0-1, "attributes": {} }
  ],
  "lighting": {
    "type": "natural|artificial|mixed",
    "colorTemperature": number (Kelvin),
    "intensity": 0-1,
    "direction": [x,y,z],
    "sources": [ { "type": "window|lamp|ceiling|screen", "position": [x,y,z], "intensity": 0-1, "color": "hex" } ]
  },
  "colorPalette": ["hex1", "hex2", ...],
  "spatialFeatures": {
    "hasDesk": boolean,
    "hasChair": boolean,
    "hasWindow": boolean,
    "hasMonitor": boolean,
    "hasWhiteboard": boolean,
    "focalPoint": [x,y,z]
  }
}

Guidelines:
- Use meters for dimensions (typical room: 3-6m wide, 3-6m deep, 2.5-3m high)
- Position origin at room center, floor at y=0
- Detect major furniture: desk, chair, bed, sofa, table, monitor, laptop, lamp, plant, bookshelf, whiteboard
- For panoramas, understand the 360° view; for regular photos, infer the room layout
- Be conservative with confidence scores
- Return ONLY valid JSON, no extra text`;

async function callGeminiVision(apiKey: string, imageData: string, prompt: string): Promise<any> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" }
  });

  const base64Data = imageData.split(',')[1];
  const mimeType = imageData.split(';')[0].split(':')[1];

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Data,
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();
  
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('No valid JSON found in Gemini response');
  }
}

export async function analyzeSceneWithGemini(
  imageData: string, 
  inputType: AIInputType,
  apiKey: string
): Promise<SceneAnalysis> {
  const result = await callGeminiVision(apiKey, imageData, SCENE_ANALYSIS_PROMPT);
  
  const surfaces: Surface[] = (result.surfaces || []).map((s: any, i: number) => ({
    id: s.id || `surface-${i}`,
    type: s.type || 'wall',
    position: s.position || [0, 0, 0],
    rotation: s.rotation || [0, 0, 0],
    dimensions: s.dimensions || [1, 1],
    material: {
      color: s.material?.color || '#1a1a2e',
      roughness: s.material?.roughness ?? 0.8,
      metalness: s.material?.metalness ?? 0.1,
      emissive: s.material?.emissive,
      emissiveIntensity: s.material?.emissiveIntensity,
    },
  }));

  const objects: DetectedObject[] = (result.objects || []).map((o: any, i: number) => ({
    id: o.id || `object-${i}`,
    type: o.type || 'unknown',
    category: o.category || 'other',
    position: o.position || [0, 0, 0],
    rotation: o.rotation || [0, 0, 0],
    scale: o.scale || [1, 1, 1],
    boundingBox: o.boundingBox || { min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
    confidence: o.confidence ?? 0.7,
    attributes: o.attributes || {},
  }));

  const lighting: LightingInfo = {
    type: result.lighting?.type || 'mixed',
    colorTemperature: result.lighting?.colorTemperature || 4000,
    intensity: result.lighting?.intensity ?? 0.5,
    direction: result.lighting?.direction || [0, -1, 0],
    sources: (result.lighting?.sources || []).map((src: any) => ({
      type: src.type || 'ceiling',
      position: src.position || [0, 2, 0],
      intensity: src.intensity ?? 0.5,
      color: src.color || '#ffffff',
    })),
  };

  return {
    id: `scene-${Date.now()}`,
    inputType,
    roomType: result.roomType || 'unknown',
    dimensions: result.dimensions || { width: 4, depth: 5, height: 2.8 },
    surfaces,
    objects,
    lighting,
    colorPalette: result.colorPalette || ['#1a1a2e', '#16213e', '#0f3460'],
    spatialFeatures: result.spatialFeatures || {
      hasDesk: false,
      hasChair: false,
      hasWindow: false,
      hasMonitor: false,
      hasWhiteboard: false,
    },
    confidence: 0.8,
    processingTime: 0,
    metadata: {
      originalImageWidth: 1024,
      originalImageHeight: 512,
      analysisVersion: 'gemini-1.5-flash',
    },
  };
}

export { mockAIProvider };

function getApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key');
  }
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
}

export const geminiProvider = {
  name: 'gemini',
  
  async analyzeScene(imageData: string, inputType: AIInputType): Promise<SceneAnalysis> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }
    return analyzeSceneWithGemini(imageData, inputType, apiKey);
  },
  
  async interpretIntent(input: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return mockAIProvider.interpretIntent(input);
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const prompt = `Classify the user's intent into one of these modes: study, brainstorm, plan, focus.
    
User input: "${input}"

Return ONLY the mode name (study|brainstorm|plan|focus).`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().toLowerCase();
    const validModes = ['study', 'brainstorm', 'plan', 'focus'];
    return validModes.includes(text) ? text : 'study';
  },
  
  async generateWorkspace(mode: string, scene: SceneAnalysis): Promise<WorkspaceConfig> {
    return generateWorkspaceConfig(mode as any, scene);
  },
};

export async function getAIProvider() {
  const providerName = process.env.NEXT_PUBLIC_AI_PROVIDER || 'auto';
  const apiKey = getApiKey();
  
  if (providerName === 'gemini' || (providerName === 'auto' && apiKey)) {
    if (apiKey) {
      return geminiProvider;
    }
  }
  
  return mockAIProvider;
}