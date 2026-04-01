// Mock for color-diff-napi since the actual package is empty/unusable

export interface SyntaxTheme {
  theme: string;
  source: string | null;
}

export class ColorDiff {
  constructor(hunk: any, firstLine: any, filePath: any, fileContent: any) {}
  render(themeName: string, width: number, dim: boolean): string[] | null {
    return null;
  }
}

export class ColorFile {
  constructor(code: string, filePath: string) {}
  render(themeName: string, width: number, dim: boolean): string[] | null {
    return null;
  }
}

export function getSyntaxTheme(themeName: string): SyntaxTheme {
  return {
    theme: themeName,
    source: null,
  };
}
