import { GoogleGenerativeAI } from '@google/generative-ai';
import { SceneAnalysis, Surface, DetectedObject, LightingInfo, InputType } from '@/lib/scene/types';
import { WorkspaceConfig } from '@/lib/workspace/types';
import { generateWorkspaceConfig } from '@/lib/workspace/generators';
import { mockAIProvider } from './mock';

type AIInputType = InputType;

const GEMINI_MODEL = 'gemini-2.5-flash';

const SCENE_ANALYSIS_PROMPT = `You are a spatial AI that analyzes interior room photos (including wide-angle panoramas) and extracts precise 3D spatial data.

CRITICAL INSTRUCTIONS:
1. This is an interior panorama. Understand the 360-degree layout:
   - Identify walls, windows, floor, ceiling, and all furniture (beds, study tables, chairs, almirahs/wardrobes, window frames, fans, monitors).
   - If there is a ceiling fan, its diameter is at most 1.0m to 1.2m, height 0.2m, and sits close to the ceiling (Y = height - 0.2). DO NOT give it a huge 3m scale.
   - Beds are typically length ~1.9m to 2.0m, width 0.9m to 1.2m, height 0.45m.
   - Study desks/tables are typically width 1.0m to 1.5m, depth 0.6m, height 0.75m.
   - Wardrobes/almirahs are tall (height ~1.8m-2.1m, width 0.9m-1.2m, depth 0.5m-0.6m).
2. If the image is NOT an interior room, set "roomType" to "unknown" and return EMPTY arrays.
3. Coordinates system (meters):
   - Center of the room is (0, 0, 0).
   - Y is vertical UP (Floor is at Y = 0, Ceiling is at Y = height).
   - X is LEFT (-) to RIGHT (+).
   - Z is DEPTH: Back wall is at Z = -(depth/2), front is at Z = +(depth/2).
   - Objects sit on the floor: Y = height / 2.

Return ONLY this JSON format (no markdown, no conversation):
{
  "roomType": "bedroom|office|living|studio|dormitory",
  "dimensions": { "width": number, "depth": number, "height": number },
  "surfaces": [
    { "id": "floor", "type": "floor", "position": [0, 0, 0], "rotation": [-1.5708, 0, 0], "dimensions": [width, depth], "material": { "color": "#f1ebe1", "roughness": 0.8, "metalness": 0.0 } },
    { "id": "ceiling", "type": "ceiling", "position": [0, height, 0], "rotation": [1.5708, 0, 0], "dimensions": [width, depth], "material": { "color": "#faf8f5", "roughness": 0.9, "metalness": 0.0 } },
    { "id": "wall-back", "type": "wall", "position": [0, height/2, -(depth/2)], "rotation": [0, 0, 0], "dimensions": [width, height], "material": { "color": "#f5f2eb", "roughness": 0.9, "metalness": 0.0 } },
    { "id": "wall-left", "type": "wall", "position": [-(width/2), height/2, 0], "rotation": [0, 1.5708, 0], "dimensions": [depth, height], "material": { "color": "#f5f2eb", "roughness": 0.9, "metalness": 0.0 } },
    { "id": "wall-right", "type": "wall", "position": [width/2, height/2, 0], "rotation": [0, -1.5708, 0], "dimensions": [depth, height], "material": { "color": "#f5f2eb", "roughness": 0.9, "metalness": 0.0 } }
  ],
  "objects": [
    { "id": "bed-1", "type": "bed", "category": "furniture", "position": [X, 0.25, Z], "rotation": [0, 0, 0], "scale": [1.0, 0.5, 2.0], "boundingBox": { "min": [-0.5, 0, -1], "max": [0.5, 0.5, 1] }, "confidence": 0.9 }
  ],
  "lighting": {
    "type": "mixed",
    "colorTemperature": 4500,
    "intensity": 0.8,
    "direction": [0, -1, 0],
    "sources": [{ "type": "window", "position": [X, Y, Z], "intensity": 0.8, "color": "#ffffff" }]
  },
  "colorPalette": ["#f5f2eb", "#c85a2b", "#2b231d"],
  "spatialFeatures": {
    "hasDesk": true,
    "hasChair": true,
    "hasWindow": true,
    "hasMonitor": true,
    "hasWhiteboard": false,
    "focalPoint": [0, 0.8, 0]
  }
}`;

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
    { id: 'floor', type: 'floor', position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], dimensions: [6, 6], material: { color: '#2a2a3e', roughness: 0.8, metalness: 0.1 } },
    { id: 'wall-back', type: 'wall', position: [0, 1.5, -3], rotation: [0, 0, 0], dimensions: [6, 3], material: { color: '#3a3a5e', roughness: 0.9, metalness: 0 } },
    { id: 'wall-left', type: 'wall', position: [-3, 1.5, 0], rotation: [0, Math.PI / 2, 0], dimensions: [6, 3], material: { color: '#3a3a5e', roughness: 0.9, metalness: 0 } },
    { id: 'wall-right', type: 'wall', position: [3, 1.5, 0], rotation: [0, -Math.PI / 2, 0], dimensions: [6, 3], material: { color: '#3a3a5e', roughness: 0.9, metalness: 0 } },
    { id: 'ceiling', type: 'ceiling', position: [0, 3, 0], rotation: [Math.PI / 2, 0, 0], dimensions: [6, 6], material: { color: '#2e2e4e', roughness: 1, metalness: 0 } },
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