declare module "qrcode-terminal" {
  export function generate(
    input: string,
    options?: { small?: boolean },
    callback?: (code: string) => void
  ): void;
}