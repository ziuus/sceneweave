import { SceneAnalysis } from '@/lib/scene/types';
import { getDemoSceneAnalysis } from '@/lib/scene/demoScene';
import { WorkspaceConfig } from '@/lib/workspace/types';
import { generateWorkspaceConfig } from '@/lib/workspace/generators';

export type AIInputType = 'panorama' | 'photo' | 'demo';

export interface AIProvider {
  name: string;
  analyzeScene: (imageData: string, inputType: AIInputType) => Promise<SceneAnalysis>;
  interpretIntent: (input: string, context?: SceneAnalysis) => Promise<string>;
  generateWorkspace: (mode: string, scene: SceneAnalysis) => Promise<WorkspaceConfig>;
}

export const mockAIProvider: AIProvider = {
  name: 'mock',
  
  async analyzeScene(imageData: string, inputType: AIInputType): Promise<SceneAnalysis> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const analysis = getDemoSceneAnalysis();
    return {
      ...analysis,
      inputType,
      id: `scene-${Date.now()}`,
      metadata: {
        ...analysis.metadata,
        originalImageWidth: 1024,
        originalImageHeight: 512,
      },
    };
  },
  
  async interpretIntent(input: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const lower = input.toLowerCase();
    
    if (lower.includes('study') || lower.includes('focus') || lower.includes('work') || lower.includes('read') || lower.includes('learn')) {
      return 'study';
    }
    if (lower.includes('brainstorm') || lower.includes('idea') || lower.includes('creative') || lower.includes('ideate') || lower.includes('think')) {
      return 'brainstorm';
    }
    if (lower.includes('plan') || lower.includes('project') || lower.includes('timeline') || lower.includes('schedule') || lower.includes('organize')) {
      return 'plan';
    }
    if (lower.includes('distraction') || lower.includes('minimal') || lower.includes('deep') || lower.includes('zen') || lower.includes('meditat')) {
      return 'focus';
    }
    return 'study';
  },
  
  async generateWorkspace(mode: string, scene: SceneAnalysis): Promise<WorkspaceConfig> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateWorkspaceConfig(mode as any, scene);
  },
};