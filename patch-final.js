const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'components/PromptInput/PromptInput.tsx');
let src = fs.readFileSync(inputPath, 'utf8');

// 1. Inject model display name
if (!src.includes('import { useMainLoopModel }')) {
  src = src.replace(
    "import { useInputBuffer } from '../../hooks/useInputBuffer.js';",
    "import { useInputBuffer } from '../../hooks/useInputBuffer.js';\nimport { useMainLoopModel } from '../../hooks/useMainLoopModel.js';\nimport { renderModelSetting } from '../../utils/model/model.js';\nimport { getEffortSuffix } from '../../utils/effort.js';"
  );
}

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

// 2. Replace the layout for messages.length === 0
const targetBoxStr = /<Box flexDirection="row" alignItems="flex-start" justifyContent="flex-start" borderColor=\{getBorderColor\(\)\} borderStyle="round" borderLeft=\{false\} borderRight=\{false\} borderBottom width="100%" borderText=\{buildBorderText\(showFastIcon \?\? false, showFastIconHint, fastModeCooldown\)\} minHeight=\{messages\.length === 0 \? 5 : undefined\}>/g;
if (targetBoxStr.test(src)) {
  src = src.replace(
    targetBoxStr,
    `{messages.length === 0 ? (
      <Box flexDirection="row" width={Math.floor(columns * 0.6)} alignSelf="center" height={5} borderStyle="round" borderColor="#4285f4" backgroundColor="#1e1e1e" paddingX={1}>
        <PromptInputModeIndicator mode={mode} isLoading={isLoading} viewingAgentName={viewingAgentName} viewingAgentColor={viewingAgentColor} />
        <Box flexGrow={1} flexShrink={1} flexDirection="column" onClick={handleInputClick}>
          <Box flexGrow={1} paddingTop={0}>{textInputElement}</Box>
          <Box paddingBottom={0}>
            <Text color="#4285f4">Build </Text><Text dimColor>Gemini 3.1 Pro Preview Google · medium</Text>
          </Box>
        </Box>
      </Box>
    ) : (
      <Box flexDirection="row" alignItems="flex-start" justifyContent="flex-start" borderColor={getBorderColor()} borderStyle="round" borderLeft={false} borderRight={false} borderBottom={true} width="100%" borderText={buildBorderText(showFastIcon ?? false, showFastIconHint, fastModeCooldown)}>
    `
  );
  
  const endBox = /<Box flexGrow=\{1\} flexShrink=\{1\} onClick=\{handleInputClick\}>\s*\{textInputElement\}\s*<\/Box>\s*<\/Box>\}/g;
  src = src.replace(
    endBox,
    `<Box flexGrow={1} flexShrink={1} flexDirection="column" onClick={handleInputClick}>
          <Box>{textInputElement}</Box>
        </Box>
      </Box>
    )}`
  );
}

fs.writeFileSync(inputPath, src);
console.log('Applied final prompt input changes with rounded full border');
