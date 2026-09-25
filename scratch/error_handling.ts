import fs from 'fs';
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

let newContent = content.replace(
  /catch \(err\) \{\n          console\.error\(err\);\n          setError\('Failed to analyze scene\. Using demo scene\.'\);\n          const demoAnalysis = getDemoSceneAnalysis\(\);\n          setSceneAnalysis\(demoAnalysis\);\n        \}/,
  `catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to analyze scene.');
          setStage('capture');
        }`
);

fs.writeFileSync('src/app/page.tsx', newContent);
console.log('Error handling updated');
