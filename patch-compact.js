const fs = require('fs');

const logoPath = 'components/LogoV2/LogoV2.tsx';
let logoSrc = fs.readFileSync(logoPath, 'utf8');

// Replace the compact layout return block
logoSrc = logoSrc.replace(
  /<Text bold=\{true\}>\{welcomeMessage\}<\/Text>\{t12\}\{t13\}<Text dimColor=\{true\}>\{billingType\}<\/Text><Text dimColor=\{true\}>\{agentName \? \`@\$\{agentName\} · \$\{truncatedCwd\}\` : truncatedCwd\}<\/Text>/g,
  `{t12}<Text bold>X Code v3.0.0</Text><Text bold={true}>{welcomeMessage}</Text>`
);

fs.writeFileSync(logoPath, logoSrc);
console.log("Patched compact layout!");
