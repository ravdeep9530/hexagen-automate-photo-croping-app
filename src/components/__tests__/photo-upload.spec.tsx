import { describe, expect, it } from 'vitest';

import PhotoUpload from '../photo-upload';

describe('PhotoUpload', () => {
  it('exports a component function', () => {
    expect(PhotoUpload).toBeTypeOf('function');
  });
});
