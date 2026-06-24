declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void): void;

  interface Expectation<T = unknown> {
    toBe(expected: T): void;
    toEqual(expected: unknown): void;
    not: Expectation<T>;
  }

  export function expect<T = unknown>(actual: T): Expectation<T>;
}
