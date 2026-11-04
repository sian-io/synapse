/// <reference types="vite/client" />

declare module 'react-dom/client' {
  import type { ReactNode } from 'react';

  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export interface RootOptions {
    identifierPrefix?: string;
    onRecoverableError?: (error: unknown, errorInfo: { componentStack?: string }) => void;
  }

  export function createRoot(container: Element | DocumentFragment, options?: RootOptions): Root;
  export function hydrateRoot(container: Element | Document, initialChildren: ReactNode, options?: RootOptions): Root;
}
