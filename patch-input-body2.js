const fs = require('fs');
const inputPath = 'components/PromptInput/PromptInput.tsx';
let src = fs.readFileSync(inputPath, 'utf8');

// Inject the modelDisplayName computation right at the top of the PromptInput function body
const funcStart = "function PromptInput({\n";
const funcBodyStart = /\} = t0;\s*const debug = t1 === undefined \? false : t1;/;

// We can just use string replacement on a known line inside the function
if (!src.includes('modelDisplayName = renderModelSetting')) {
  src = src.replace(
    /const maxVisibleLines = isFullscreenEnvEnabled\(\)/,
    `const _model = useMainLoopModel();
  const _effortValue = useAppState(function(s) { return s.effortValue; });
  const _effortSuffix = getEffortSuffix(_model, _effortValue);
  const modelDisplayName = renderModelSetting(_model) + _effortSuffix;
  const maxVisibleLines = isFullscreenEnvEnabled()`
  );
}

// Update the rendering box
const oldRenderBox = /<Box flexGrow=\{1\} flexShrink=\{1\} onClick=\{handleInputClick\}>\s*\{textInputElement\}\s*<\/Box>/g;
const newRenderBox = `<Box flexGrow={1} flexShrink={1} flexDirection="column" onClick={handleInputClick}>
            <Box minHeight={messages.length === 0 ? 3 : undefined}>{textInputElement}</Box>
            {messages.length === 0 && (
              <Box marginTop={1}>
                <Text color="blue">Build </Text><Text>{modelDisplayName}</Text>
              </Box>
            )}
          </Box>`;

src = src.replace(oldRenderBox, newRenderBox);

fs.writeFileSync(inputPath, src);
console.log("Updated PromptInput rendering box!");
