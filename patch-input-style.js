const fs = require('fs');
const inputPath = 'components/PromptInput/PromptInput.tsx';
let src = fs.readFileSync(inputPath, 'utf8');

// The string we want to replace
const targetStr = /borderColor=\{getBorderColor\(\)\} borderStyle="round" borderLeft=\{messages\.length === 0 \? true : false\} borderRight=\{messages\.length === 0 \? true : false\} borderBottom width=\{messages\.length === 0 \? Math\.floor\(columns \* 0\.5\) : "100%"\} alignSelf="center" borderText=\{buildBorderText\(showFastIcon \?\? false, showFastIconHint, fastModeCooldown\)\} minHeight=\{messages\.length === 0 \? 2 : undefined\}/;

const newStr = `borderColor={messages.length === 0 ? "#4285f4" : getBorderColor()} borderStyle={messages.length === 0 ? "single" : "round"} borderLeft={messages.length === 0 ? true : false} borderRight={false} borderBottom={messages.length === 0 ? false : true} borderTop={messages.length === 0 ? false : true} backgroundColor={messages.length === 0 ? "#1e1e1e" : undefined} width={messages.length === 0 ? Math.floor(columns * 0.6) : "100%"} alignSelf="center" borderText={messages.length === 0 ? undefined : buildBorderText(showFastIcon ?? false, showFastIconHint, fastModeCooldown)} minHeight={messages.length === 0 ? 2 : undefined} paddingX={messages.length === 0 ? 1 : 0} paddingY={messages.length === 0 ? 1 : 0}`;

src = src.replace(targetStr, newStr);

fs.writeFileSync(inputPath, src);
console.log("Updated PromptInput styling!");
