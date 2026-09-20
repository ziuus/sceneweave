import { SceneAnalysis } from '@/lib/scene/types';
import { WorkspaceConfig } from '@/lib/workspace/types';
import { mockAIProvider } from './mock';
import { getAIProvider as getRealAIProvider, geminiProvider } from './gemini';

export type AIInputType = 'panorama' | 'photo' | 'demo';

export interface AIProvider {
  name: string;
  analyzeScene: (imageData: string, inputType: AIInputType) => Promise<SceneAnalysis>;
  interpretIntent: (input: string, context?: SceneAnalysis) => Promise<string>;
  generateWorkspace: (mode: string, scene: SceneAnalysis) => Promise<WorkspaceConfig>;
}

export { mockAIProvider, geminiProvider };

export async function getAIProvider(): Promise<AIProvider> {
  return getRealAIProvider();
}

export async function analyzeScene(imageData: string, inputType: AIInputType = 'photo'): Promise<SceneAnalysis> {
  try {
    const provider = await getAIProvider();
    return await provider.analyzeScene(imageData, inputType);
  } catch (error) {
    console.error('Scene analysis failed, falling back to mock:', error);
    return mockAIProvider.analyzeScene(imageData, inputType);
  }
}

export async function interpretIntent(input: string, scene?: SceneAnalysis): Promise<string> {
  try {
    const provider = await getAIProvider();
    return await provider.interpretIntent(input, scene);
  } catch (error) {
    console.error('Intent interpretation failed, falling back to mock:', error);
    return mockAIProvider.interpretIntent(input);
  }
}

export async function generateWorkspace(mode: string, scene: SceneAnalysis): Promise<WorkspaceConfig> {
  try {
    const provider = await getAIProvider();
    return await provider.generateWorkspace(mode, scene);
  } catch (error) {
    console.error('Workspace generation failed, falling back to mock:', error);
    return mockAIProvider.generateWorkspace(mode, scene);
  }
}