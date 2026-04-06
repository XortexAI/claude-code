const fs = require('fs');

const condensedPath = 'components/LogoV2/CondensedLogo.tsx';
let condensedSrc = fs.readFileSync(condensedPath, 'utf8');

// Replace the return block for condensed logo
condensedSrc = condensedSrc.replace(
  /<OffscreenFreeze><Box flexDirection="row" gap=\{2\} alignItems="center">\{t4\}<Box flexDirection="column">\{t6\}\{t7\}\{t9\}<Text bold>Welcome to Xcode now you can you have persistent memory\.<\/Text>\{t10\}\{t11\}<\/Box><\/Box><\/OffscreenFreeze>/g,
  `<OffscreenFreeze><Box flexDirection="column" alignItems="center">{t4}{t6}<Text bold>Welcome to Xcode now you can you have persistent memory.</Text>{t10}{t11}</Box></OffscreenFreeze>`
);

fs.writeFileSync(condensedPath, condensedSrc);
console.log("Patched CondensedLogo!");
