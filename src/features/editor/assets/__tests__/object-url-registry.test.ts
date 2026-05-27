import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ObjectUrlRegistry,
  createObjectURLRegistry,
  createPreviewObjectURL,
  createProcessedObjectURL,
  createDownloadObjectURL,
  revokeObjectURL,
  revokeAllObjectURLs,
  isObjectURL,
} from '../object-url-registry';

let objectUrlCounter = 0;

beforeEach(() => {
  objectUrlCounter = 0;
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => `blob:vitest/${++objectUrlCounter}`),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ObjectURLRegistry', () => {
  let registry: ObjectUrlRegistry;

  beforeEach(() => {
    registry = createObjectURLRegistry();
  });

  afterEach(() => {
    registry.disposeAll();
  });

  it('creates and tracks object URLs for preview, processed, and download purposes', () => {
    const preview = registry.register(new Blob(['preview'], { type: 'image/jpeg' }), 'preview');
    const processed = registry.register(new Blob(['processed'], { type: 'image/png' }), 'processed');
    const download = registry.register(new Blob(['download'], { type: 'image/webp' }), 'download');

    expect(preview).toMatch(/^blob:/);
    expect(processed).toMatch(/^blob:/);
    expect(download).toMatch(/^blob:/);
    expect(registry.size()).toBe(3);
    expect(registry.getMetadata(preview)?.purpose).toBe('preview');
    expect(registry.getMetadata(processed)?.purpose).toBe('processed');
    expect(registry.getMetadata(download)?.purpose).toBe('download');
  });

  it('revokes a specific URL and removes its metadata', () => {
    const url = registry.register(new Blob(['test'], { type: 'image/jpeg' }), 'preview');

    expect(registry.has(url)).toBe(true);
    expect(registry.revoke(url)).toBe(true);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    expect(registry.has(url)).toBe(false);
    expect(registry.getMetadata(url)).toBeNull();
  });

  it('revokes all URLs by purpose without touching other purposes', () => {
    const preview1 = registry.register(new Blob(['one']), 'preview');
    const preview2 = registry.register(new Blob(['two']), 'preview');
    const processed = registry.register(new Blob(['three']), 'processed');

    expect(registry.revokeByPurpose('preview')).toBe(2);

    expect(registry.has(preview1)).toBe(false);
    expect(registry.has(preview2)).toBe(false);
    expect(registry.has(processed)).toBe(true);
    expect(registry.size()).toBe(1);
  });

  it('disposes all registered URLs for shared cleanup guardrails', () => {
    registry.register(new Blob(['preview']), 'preview');
    registry.register(new Blob(['processed']), 'processed');
    registry.register(new Blob(['download']), 'download');

    expect(registry.disposeAll()).toBe(3);
    expect(registry.size()).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  });

  it('returns URLs by purpose and estimates memory usage', () => {
    const first = registry.register(new Blob(['x'.repeat(1000)]), 'preview');
    const second = registry.register(new Blob(['x'.repeat(2000)]), 'preview');
    registry.register(new Blob(['x'.repeat(500)]), 'processed');

    expect(registry.getURLsByPurpose('preview')).toEqual([first, second]);
    expect(registry.getTotalMemoryUsage()).toBe(3500);
  });

  it('handles non-object URL revocation gracefully', () => {
    expect(registry.revoke('https://example.com/photo.jpg')).toBe(false);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('rejects invalid registration inputs', () => {
    expect(() => registry.register(null as unknown as Blob, 'preview')).toThrow('Invalid input');
    expect(() => registry.register({} as Blob, 'preview')).toThrow('Invalid input');
  });
});

describe('convenience functions', () => {
  let registry: ObjectUrlRegistry;

  beforeEach(() => {
    registry = createObjectURLRegistry();
  });

  afterEach(() => {
    registry.disposeAll();
  });

  it('creates purpose-specific object URLs', () => {
    const preview = createPreviewObjectURL(new Blob(['preview']), registry);
    const processed = createProcessedObjectURL(new Blob(['processed']), registry);
    const download = createDownloadObjectURL(new Blob(['download']), registry);

    expect(registry.getMetadata(preview)?.purpose).toBe('preview');
    expect(registry.getMetadata(processed)?.purpose).toBe('processed');
    expect(registry.getMetadata(download)?.purpose).toBe('download');
  });

  it('revokes one or all object URLs through helper functions', () => {
    const one = createPreviewObjectURL(new Blob(['one']), registry);
    createProcessedObjectURL(new Blob(['two']), registry);

    expect(revokeObjectURL(one, registry)).toBe(true);
    expect(registry.has(one)).toBe(false);
    expect(revokeAllObjectURLs(registry)).toBe(1);
    expect(registry.size()).toBe(0);
  });
});

describe('isObjectURL', () => {
  it('identifies only blob object URLs', () => {
    expect(isObjectURL('blob:https://example.com/abc123')).toBe(true);
    expect(isObjectURL('blob:null/xyz789')).toBe(true);
    expect(isObjectURL('https://example.com/photo.jpg')).toBe(false);
    expect(isObjectURL('data:image/jpeg;base64,abc')).toBe(false);
  });
});
