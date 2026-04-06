const fs = require('fs');

const logoPath = 'components/LogoV2/LogoV2.tsx';
let logoSrc = fs.readFileSync(logoPath, 'utf8');

// 1. Remove t20, t21, t22 rendering in LogoV2.tsx (the full logo part)
logoSrc = logoSrc.replace(
  /let t22;\s+if \(\$\[53\] !== t20 \|\| \$\[54\] !== t21\) \{\s+t22 = <Box flexDirection="column" alignItems="center">\{t20\}\{t21\}<\/Box>;/g,
  `let t22;\n  if (true) {\n    t22 = <Box flexDirection="column" alignItems="center"><Text bold>X Code v3.0.0</Text></Box>;`
);

// Modify t23 to put t19 (logo), then t22 (version), then t18 (welcome message) and take full width
logoSrc = logoSrc.replace(
  /t23 = <Box flexDirection="column" width=\{leftWidth\} justifyContent="space-between" alignItems="center" minHeight=\{9\}>\{t18\}\{t19\}\{t22\}<\/Box>;/g,
  `t23 = <Box flexDirection="column" width="100%" justifyContent="center" alignItems="center" minHeight={9}>{t19}{t22}{t18}</Box>;`
);

// Remove t24 and t25 to clear the right panel (FeedColumn) and divider
logoSrc = logoSrc.replace(
  /t24 = layoutMode === "horizontal" && <Box height="100%" borderStyle="single" borderColor="claude" borderDimColor=\{true\} borderTop=\{false\} borderBottom=\{false\} borderLeft=\{false\} \/>;/g,
  `t24 = null;`
);

logoSrc = logoSrc.replace(
  /const t25 = layoutMode === "horizontal" && <FeedColumn .*? \/>;/g,
  `const t25 = null;`
);

fs.writeFileSync(logoPath, logoSrc);

const footerPath = 'components/PromptInput/PromptInputFooterLeftSide.tsx';
let footerSrc = fs.readFileSync(footerPath, 'utf8');

// Add imports for model name in PromptInputFooterLeftSide.tsx
if (!footerSrc.includes('useMainLoopModel')) {
  const importInsertPoint = "import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';";
  footerSrc = footerSrc.replace(
    importInsertPoint,
    importInsertPoint + "\nimport { useMainLoopModel } from '../../hooks/useMainLoopModel.js';\nimport { renderModelSetting } from '../../utils/model/model.js';\nimport { getEffortSuffix } from '../../utils/effort.js';"
  );
}

// Inject model name resolution
if (!footerSrc.includes('const _model = useMainLoopModel()')) {
  const bodyInsertPoint = "const hasBackgroundTasks =";
  footerSrc = footerSrc.replace(
    bodyInsertPoint,
    `const _model = useMainLoopModel();
  const _effortValue = useAppState(s => s.effortValue);
  const _effortSuffix = getEffortSuffix(_model, _effortValue);
  const modelDisplayName = renderModelSetting(_model) + _effortSuffix;
  const hasBackgroundTasks =`
  );
}

// Replace "? for shortcuts" with model name
footerSrc = footerSrc.replace(
  /\? for shortcuts/g,
  `{modelDisplayName}`
);

fs.writeFileSync(footerPath, footerSrc);

const inputPath = 'components/PromptInput/PromptInput.tsx';
let inputSrc = fs.readFileSync(inputPath, 'utf8');

// Make the input box full and small
inputSrc = inputSrc.replace(
  /borderLeft=\{false\} borderRight=\{false\} borderBottom width="100%" borderText=\{buildBorderText\(showFastIcon \?\? false, showFastIconHint, fastModeCooldown\)\} minHeight=\{messages\.length === 0 \? 5 : undefined\}/g,
  `width="80%" alignSelf="center" borderText={buildBorderText(showFastIcon ?? false, showFastIconHint, fastModeCooldown)} minHeight={messages.length === 0 ? 2 : undefined}`
);

fs.writeFileSync(inputPath, inputSrc);
console.log("Patched successfully!");
