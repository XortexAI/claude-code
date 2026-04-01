// Global type declarations for Ink
declare module 'ink' {
  export * from './index.js';
}

declare module 'react' {
  export = React;
}

declare namespace React {
  export type ReactNode = any;
  export type Ref<T> = any;
  export type PropsWithChildren<P> = P & { children?: ReactNode };
  export function createElement(type: any, props: any, ...children: any[]): any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ink-box': any;
      'ink-text': any;
    }
  }
}

export {};
