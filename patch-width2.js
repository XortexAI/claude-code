const fs = require('fs');

const fsLayoutPath = 'components/FullscreenLayout.tsx';
let fsLayoutSrc = fs.readFileSync(fsLayoutPath, 'utf8');

// Replace width="50%" with width={Math.floor(columns * 0.6)}
fsLayoutSrc = fsLayoutSrc.replace(
  /<Box width="50%" flexDirection="column" alignItems="center">/g,
  `<Box width={Math.floor(columns * 0.6)} flexDirection="column" alignItems="center">`
);

fs.writeFileSync(fsLayoutPath, fsLayoutSrc);
console.log("Patched FullscreenLayout integer width!");
