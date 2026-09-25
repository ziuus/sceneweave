import fs from 'fs';
const content = fs.readFileSync('src/lib/ai/index.ts', 'utf8');

const newAnalyzeScene = `export async function analyzeScene(imageData: string, inputType: AIInputType = 'photo'): Promise<SceneAnalysis> {
  if (inputType === 'demo') {
    return mockAIProvider.analyzeScene(imageData, inputType);
  }
  
  const provider = await getAIProvider();
  return await provider.analyzeScene(imageData, inputType);
}`;

let newContent = content.replace(/export async function analyzeScene[\s\S]*?\}\n\}/, newAnalyzeScene);
fs.writeFileSync('src/lib/ai/index.ts', newContent);
console.log('Fixed analyzeScene fallback');
