const fs = require('fs');

const logoPath = 'components/LogoV2/LogoV2.tsx';
let logoSrc = fs.readFileSync(logoPath, 'utf8');

logoSrc = logoSrc.replace(
  /t23 = <Box flexDirection="column" width="100%" justifyContent="center" alignItems="center" minHeight=\{9\}>\{t19\}\{t22\}\{t18\}<\/Box>;/g,
  `t23 = <Box flexDirection="column" width="100%" justifyContent="center" alignItems="center" minHeight={9}><Box flexDirection="row" alignItems="center" gap={2}>{t19}{t22}</Box>{t18}</Box>;`
);

fs.writeFileSync(logoPath, logoSrc);
console.log("Patched LogoV2 side-by-side!");
