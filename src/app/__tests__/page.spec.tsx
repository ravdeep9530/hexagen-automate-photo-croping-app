import { describe, expect, it, vi } from 'vitest';

import Page from '../page';

vi.mock('../../hooks/use-photo-status', () => ({
  usePhotoStatus: vi.fn(() => ({
    loading: false,
    error: null,
    status: 'cropped',
    uploadedPhotoUrl: 'https://example.com/uploaded.jpg',
    croppedPhotoUrl: 'https://example.com/cropped.jpg',
    complianceStatus: 'compliant',
    hasUploaded: true,
    hasCropped: true,
    refresh: vi.fn(),
  })),
}));

describe('Page', () => {
  it('exports a page component', () => {
    expect(Page).toBeTypeOf('function');
  });
});
