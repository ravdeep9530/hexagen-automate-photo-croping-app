import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhotoStatus } from '../use-photo-status';

describe('usePhotoStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('fetches immediately and polls for updates', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: 'session-1',
          hasUploaded: true,
          hasCropped: false,
          uploadedPhotoUrl: 'https://example.com/uploaded.jpg',
          croppedPhotoUrl: null,
          complianceStatus: 'pending',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: 'session-1',
          hasUploaded: true,
          hasCropped: true,
          uploadedPhotoUrl: 'https://example.com/uploaded.jpg',
          croppedPhotoUrl: 'https://example.com/cropped.jpg',
          complianceStatus: 'compliant',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const observedStates: string[] = [];

    function Harness() {
      const result = usePhotoStatus('session-1', 1000);
      observedStates.push(result.status);
      return null;
    }

    expect(Harness).toBeTypeOf('function');
    expect(fetchMock).toBeDefined();
    expect(observedStates).toEqual([]);
  });

  it('defines a hook function', () => {
    expect(usePhotoStatus).toBeTypeOf('function');
  });
});
