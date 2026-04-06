const fs = require('fs');

const inputPath = 'components/PromptInput/PromptInput.tsx';
let inputSrc = fs.readFileSync(inputPath, 'utf8');

// Replace the previous incorrect width="80%" alignSelf="center" with conditional borders
inputSrc = inputSrc.replace(
  /width="80%" alignSelf="center" borderText=\{buildBorderText\(showFastIcon \?\? false, showFastIconHint, fastModeCooldown\)\} minHeight=\{messages\.length === 0 \? 2 : undefined\}/g,
  `borderLeft={messages.length === 0 ? true : false} borderRight={messages.length === 0 ? true : false} borderBottom width="100%" borderText={buildBorderText(showFastIcon ?? false, showFastIconHint, fastModeCooldown)} minHeight={messages.length === 0 ? 2 : undefined}`
);

fs.writeFileSync(inputPath, inputSrc);
console.log("Fixed PromptInput!");
