const fs = require('fs');
const inputPath = 'components/PromptInput/PromptInput.tsx';
const src = fs.readFileSync(inputPath, 'utf8');

// Extract the prompt rendering logic to understand it
const match = src.match(/borderLeft=\{messages\.length === 0.*?(?=minHeight=\{messages\.length)/s);
console.log(match ? match[0] : "Not found");
