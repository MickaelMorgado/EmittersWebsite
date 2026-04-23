declare module "@strudel/web" {
  export function initStrudel(config?: Record<string, unknown>): Promise<void>;

  export function evaluate(code: string): unknown;

  export type Pattern = unknown;
}
