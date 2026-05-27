import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPendingUrlsCount, revokeImmediate, triggerDownload } from '../download';

describe('triggerDownload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    document.body.innerHTML = '';
    global.URL.createObjectURL = vi.fn(() => 'blob:download-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('creates an object URL, clicks a temporary anchor, and revokes later', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const result = triggerDownload({
      blob: new Blob(['image'], { type: 'image/png' }),
      filename: 'passport-photo.png',
      format: 'png',
      revokeAfterMs: 100,
    });

    expect(result).toEqual({ url: 'blob:download-url', filename: 'passport-photo.png', format: 'png' });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a')).toBeNull();
    expect(getPendingUrlsCount()).toBe(1);

    vi.advanceTimersByTime(100);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-url');
    expect(getPendingUrlsCount()).toBe(0);
  });

  it('can revoke an object URL immediately', () => {
    triggerDownload({
      blob: new Blob(['image'], { type: 'image/jpeg' }),
      filename: 'passport-photo.jpg',
      format: 'jpeg',
      revokeAfterMs: 1_000,
    });

    revokeImmediate('blob:download-url');

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-url');
    expect(getPendingUrlsCount()).toBe(0);
  });
});
