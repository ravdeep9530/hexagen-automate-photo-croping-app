declare module 'node:assert/strict' {
  interface AssertStrict {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    strictEqual(actual: unknown, expected: unknown, message?: string): void;
  }

  const assert: AssertStrict;
  export default assert;
}

declare module 'node:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void): void;
}
