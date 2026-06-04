import { describe, expect, it } from 'vitest';

import PassportGuidelines from '../passport-guidelines';

describe('PassportGuidelines', () => {
  it('exports a component function', () => {
    expect(PassportGuidelines).toBeTypeOf('function');
  });
});
