const fs = require('fs');

const fsLayoutPath = 'components/FullscreenLayout.tsx';
let fsLayoutSrc = fs.readFileSync(fsLayoutPath, 'utf8');

// Replace width="80%" with width="50%" for the initial prompt centered box
fsLayoutSrc = fsLayoutSrc.replace(
  /<Box width="80%" flexDirection="column" alignItems="center">/g,
  `<Box width="50%" flexDirection="column" alignItems="center">`
);

fs.writeFileSync(fsLayoutPath, fsLayoutSrc);
console.log("Patched FullscreenLayout width!");
