const fs = require('fs');

const condensedPath = 'components/LogoV2/CondensedLogo.tsx';
let condensedSrc = fs.readFileSync(condensedPath, 'utf8');

// Replace the layout to put logo (t4) and text (t6) in a row
condensedSrc = condensedSrc.replace(
  /<OffscreenFreeze><Box width="100%" flexDirection="column" alignItems="center">\{t4\}\{t6\}<Text bold align="center">Welcome to Xcode now you can you have persistent memory\.<\/Text>\{t10\}\{t11\}<\/Box><\/OffscreenFreeze>/g,
  `<OffscreenFreeze><Box width="100%" flexDirection="column" alignItems="center"><Box flexDirection="row" alignItems="center" gap={2}>{t4}{t6}</Box><Text bold align="center">Welcome to Xcode now you can you have persistent memory.</Text>{t10}{t11}</Box></OffscreenFreeze>`
);

fs.writeFileSync(condensedPath, condensedSrc);
console.log("Patched CondensedLogo side-by-side!");
