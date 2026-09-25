import { GoogleGenerativeAI } from '@google/generative-ai';
import { SceneAnalysis, Surface, DetectedObject, LightingInfo, InputType } from '@/lib/scene/types';
import { WorkspaceConfig } from '@/lib/workspace/types';
import { generateWorkspaceConfig } from '@/lib/workspace/generators';
import { mockAIProvider } from './mock';

type AIInputType = InputType;

const GEMINI_MODEL = 'gemini-2.5-flash';

const SCENE_ANALYSIS_PROMPT = `You are a spatial AI that analyzes photos and returns a detailed structured scene understanding.

CRITICAL INSTRUCTIONS:
1. If the image is NOT an interior room (e.g., it is a car, landscape, animal, or exterior), set "roomType" to "unknown" and return EMPTY arrays for "surfaces" and "objects". Do not invent walls or desks.
2. DO NOT just copy the example JSON structure. Build the arrays based ONLY on what you actually see.

Analyze the provided image and return a JSON object with this exact structure (this is just a schema example, replace with actual detected data):

{
  "roomType": "office|bedroom|living|studio|kitchen|unknown",
  "dimensions": { "width": number, "depth": number, "height": number },
  "surfaces": [
    { "id": "floor", "type": "floor", "position": [x,y,z], "rotation": [rx,ry,rz], "dimensions": [w,h], "material": { "color": "hex", "roughness": 0-1, "metalness": 0-1 } }
  ],
  "objects": [
    { "id": "obj-1", "type": "desk|bed|chair|sofa|monitor|car|etc", "category": "furniture|vehicle|other", "position": [x,y,z], "rotation": [rx,ry,rz], "scale": [x,y,z], "boundingBox": { "min": [x,y,z], "max": [x,y,z] }, "confidence": 0-1, "attributes": {} }
  ],
  "lighting": {
    "type": "natural|artificial|mixed",
    "colorTemperature": 4000,
    "intensity": 0.5,
    "direction": [0,-1,0],
    "sources": []
  },
  "colorPalette": ["hex1", "hex2"],
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
  let text = response.text();
  
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error('Gemini parsing error:', err, 'Raw text:', text);
    throw new Error('No valid JSON found in Gemini response');
  }
}

export async function analyzeSceneWithGemini(
  imageData: string, 
  inputType: AIInputType,
  apiKey: string
): Promise<SceneAnalysis> {
  const result = await callGeminiVision(apiKey, imageData, SCENE_ANALYSIS_PROMPT);
  
  const parsedSurfaces: Surface[] = (result.surfaces || []).map((s: any, i: number) => {
    let rotation = s.rotation || [0, 0, 0];
    if (s.type === 'floor') rotation = [-Math.PI / 2, 0, 0];
    if (s.type === 'ceiling') rotation = [Math.PI / 2, 0, 0];
    
    return {
      id: s.id || `surface-${i}`,
      type: s.type || 'wall',
      position: s.position || [0, 0, 0],
      rotation,
      dimensions: s.dimensions || [5, 3],
      material: {
        color: s.material?.color || '#1a1a2e',
        roughness: s.material?.roughness ?? 0.8,
        metalness: s.material?.metalness ?? 0.1,
        emissive: s.material?.emissive,
        emissiveIntensity: s.material?.emissiveIntensity,
      },
    };
  });

  // If Gemini returned no surfaces (e.g. non-room image), build a minimal default room
  const surfaces: Surface[] = parsedSurfaces.length > 0 ? parsedSurfaces : [
    { id: 'floor', type: 'floor', position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], dimensions: [6, 6], material: { color: '#1a1a2e', roughness: 0.8, metalness: 0.1 } },
    { id: 'wall-back', type: 'wall', position: [0, 1.5, -3], rotation: [0, 0, 0], dimensions: [6, 3], material: { color: '#16213e', roughness: 0.9, metalness: 0 } },
    { id: 'wall-left', type: 'wall', position: [-3, 1.5, 0], rotation: [0, Math.PI / 2, 0], dimensions: [6, 3], material: { color: '#16213e', roughness: 0.9, metalness: 0 } },
    { id: 'wall-right', type: 'wall', position: [3, 1.5, 0], rotation: [0, -Math.PI / 2, 0], dimensions: [6, 3], material: { color: '#16213e', roughness: 0.9, metalness: 0 } },
    { id: 'ceiling', type: 'ceiling', position: [0, 3, 0], rotation: [Math.PI / 2, 0, 0], dimensions: [6, 6], material: { color: '#0f3460', roughness: 1, metalness: 0 } },
  ];

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
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || envKey;
  }
  return process.env.GEMINI_API_KEY || envKey;
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