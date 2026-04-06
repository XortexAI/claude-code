const fs = require('fs');

// 1. Patch FullscreenLayout.tsx
let flPath = 'components/FullscreenLayout.tsx';
let flCode = fs.readFileSync(flPath, 'utf8');

flCode = flCode.replace('const $ = _c(47);', 'const $ = _c(48);');
flCode = flCode.replace(
  'newMessageCount: t3,\n    onPillClick\n  } = t0;',
  'newMessageCount: t3,\n    onPillClick,\n    isFirstPrompt: t100\n  } = t0;'
);

flCode = flCode.replace(
  'if ($[11] !== overlay || $[12] !== scrollRef || $[13] !== t10 || $[14] !== t9) {',
  'if ($[11] !== overlay || $[12] !== scrollRef || $[13] !== t10 || $[14] !== t9 || $[47] !== t100) {'
);
flCode = flCode.replace(
  't11 = <ScrollBox ref={scrollRef} flexGrow={1} flexDirection="column" paddingTop={t9} stickyScroll={true}>{t10}{overlay}</ScrollBox>;',
  't11 = <ScrollBox ref={scrollRef} flexGrow={t100 ? 0 : 1} flexDirection="column" paddingTop={t9} stickyScroll={true}>{t10}{overlay}</ScrollBox>;'
);

flCode = flCode.replace(
  'if ($[24] !== t11 || $[25] !== t12 || $[26] !== t13 || $[27] !== t8) {',
  'if ($[24] !== t11 || $[25] !== t12 || $[26] !== t13 || $[27] !== t8 || $[47] !== t100) {'
);
flCode = flCode.replace(
  't14 = <Box flexGrow={1} flexDirection="column" overflow="hidden">{t8}{t11}{t12}{t13}</Box>;',
  't14 = <Box flexGrow={t100 ? 0 : 1} flexDirection="column" overflow="hidden" alignItems={t100 ? "center" : undefined}>{t8}{t11}{t12}{t13}</Box>;'
);

flCode = flCode.replace(
  'if ($[31] !== bottom) {',
  'if ($[31] !== bottom || $[47] !== t100) {'
);
flCode = flCode.replace(
  't17 = <Box flexDirection="column" flexShrink={0} width="100%" maxHeight="50%">{t15}{t16}<Box flexDirection="column" width="100%" flexGrow={1} overflowY="hidden">{bottom}</Box></Box>;',
  't17 = <Box flexDirection="column" flexShrink={0} width="100%" maxHeight={t100 ? "100%" : "50%"}>{t15}{t16}<Box flexDirection="column" width="100%" flexGrow={t100 ? 0 : 1} overflowY="hidden">{bottom}</Box></Box>;'
);

flCode = flCode.replace(
  'if ($[38] !== t14 || $[39] !== t17 || $[40] !== t18) {',
  'if ($[38] !== t14 || $[39] !== t17 || $[40] !== t18 || $[47] !== t100) {'
);
flCode = flCode.replace(
  't19 = <PromptOverlayProvider>{t14}{t17}{t18}</PromptOverlayProvider>;',
  `t19 = <PromptOverlayProvider>
        {t100 ? (
          <Box flexGrow={1} flexDirection="column" justifyContent="center" alignItems="center" width="100%">
            {t14}
            <Box width="80%" flexDirection="column" alignItems="center">
              {t17}
            </Box>
          </Box>
        ) : (
          <>{t14}{t17}</>
        )}
        {t18}
      </PromptOverlayProvider>;`
);

fs.writeFileSync(flPath, flCode);

// 2. Patch REPL.tsx
let replPath = 'screens/REPL.tsx';
let replCode = fs.readFileSync(replPath, 'utf8');

if (!replCode.includes('isFirstPrompt={messages.length === 0}')) {
  replCode = replCode.replace(
    '<FullscreenLayout\n          scrollRef={scrollRef}',
    '<FullscreenLayout\n          isFirstPrompt={messages.length === 0}\n          scrollRef={scrollRef}'
  );
  fs.writeFileSync(replPath, replCode);
}

// 3. Patch PromptInput.tsx
let piPath = 'components/PromptInput/PromptInput.tsx';
let piCode = fs.readFileSync(piPath, 'utf8');

if (!piCode.includes('minHeight={messages.length === 0 ? 5 : undefined}')) {
  piCode = piCode.replace(
    /borderText=\{buildBorderText\(showFastIcon \?\? false, showFastIconHint, fastModeCooldown\)\}>/g,
    'borderText={buildBorderText(showFastIcon ?? false, showFastIconHint, fastModeCooldown)} minHeight={messages.length === 0 ? 5 : undefined}>'
  );
  fs.writeFileSync(piPath, piCode);
}

console.log("Patched files successfully.");