// Type declarations for packages that don't ship their own types

declare module 'qrcode-terminal' {
  export function generate(text: string, options?: { small?: boolean }): void;
}
