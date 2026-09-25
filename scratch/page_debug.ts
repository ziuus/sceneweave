import fs from 'fs';
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

let newContent = content.replace(
  /import \{ ErrorToast \} from '@\/components\/ui\/ErrorToast';/,
  `import { ErrorToast } from '@/components/ui/ErrorToast';\nimport { DebugPanel } from '@/components/ui/DebugPanel';`
);

newContent = newContent.replace(
  /<\/main>/,
  `  {sceneAnalysis && <DebugPanel scene={sceneAnalysis} capturedInput={capturedInput} />}\n    </main>`
);

fs.writeFileSync('src/app/page.tsx', newContent);
console.log('Added DebugPanel to page.tsx');
