const fs = require('fs');
const inputPath = 'components/PromptInput/PromptInput.tsx';
let src = fs.readFileSync(inputPath, 'utf8');

// Inject the imports
if (!src.includes('renderModelSetting')) {
  src = src.replace(
    "import { useMainLoopModel } from '../../hooks/useMainLoopModel.js';",
    "import { useMainLoopModel } from '../../hooks/useMainLoopModel.js';\nimport { renderModelSetting } from '../../utils/model/model.js';\nimport { getEffortSuffix } from '../../utils/effort.js';"
  );
}

// Inject the modelDisplayName computation in the component body
if (!src.includes('modelDisplayName = renderModelSetting')) {
  src = src.replace(
    "const mode = isVimModeEnabled() ? vimMode : undefined;",
    `const mode = isVimModeEnabled() ? vimMode : undefined;
  const _model = useMainLoopModel();
  const _effortValue = useAppState(_temp2);
  const _effortSuffix = getEffortSuffix(_model, _effortValue);
  const modelDisplayName = renderModelSetting(_model) + _effortSuffix;`
  );
}

// Ensure _temp2 is defined. It probably is in LogoV2, but let's just make it a local inline function or use the direct selector `s => s.effortValue`.
// Actually, `useAppState(s => s.effortValue)` might not work because the compiler compiled it. Let's just use an inline function `function(s) { return s.effortValue; }`.
src = src.replace(
  `useAppState(_temp2)`,
  `useAppState(function(s) { return s.effortValue; })`
);

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
