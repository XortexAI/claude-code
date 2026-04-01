// Build-time macros - stubbed for development

export const MACRO = {
  VERSION: '0.1.0-dev (xcode)',
  VERSION_CHANGELOG: '',
  NATIVE_PACKAGE_URL: '@anthropic-ai/claude-code-native',
  CLI_BIN_PATH: './cli.tsx',
  CLI_WRAPPER_PATH: './cli-wrapper.ts',
  BUILD_TIME: new Date().toISOString(),
  IS_DEV: true,
  IS_PROD: false,
} as const;

// For global access
declare global {
  var MACRO: typeof MACRO;
}

// Set global if not already set
if (typeof globalThis.MACRO === 'undefined') {
  globalThis.MACRO = MACRO;
}

export default MACRO;
