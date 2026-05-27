import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ObjectUrlRegistry,
  createObjectUrlLifecycle,
  createTemporaryObjectUrl,
  getGlobalObjectUrlRegistry,
  resetGlobalObjectUrlRegistry,
  safeRevokeObjectUrl,
} from '../object-url-registry';

let counter = 0;
const blob = () => new Blob(['x'], { type: 'image/jpeg' });

beforeEach(() => {
  counter = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => `blob:mock-${++counter}`),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  resetGlobalObjectUrlRegistry();
});

describe('ObjectUrlRegistry', () => {
  it('creates and tracks object URLs with metadata', () => {
    const registry = new ObjectUrlRegistry();
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

    const url = registry.createFromFile(file, { purpose: 'upload' });

    expect(url).toBe('blob:mock-1');
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(registry.has(url)).toBe(true);
    expect(registry.get(url)).toMatchObject({
      url,
      source: 'file',
      metadata: { fileName: 'photo.jpg', fileType: 'image/jpeg', purpose: 'upload' },
    });
  });

  it('revokes a managed URL and records cleanup', () => {
    const registry = new ObjectUrlRegistry();
    const url = registry.create(blob());

    expect(registry.revoke(url)).toBe(true);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    expect(registry.has(url)).toBe(false);
    expect(registry.isRevoked(url)).toBe(true);
    expect(registry.getStats()).toEqual({ totalUrls: 1, activeUrls: 0, revokedUrls: 1 });
  });

  it('returns false when revoking an unmanaged URL', () => {
    expect(new ObjectUrlRegistry().revoke('blob:missing')).toBe(false);
  });

  it('replaces URLs by revoking the old URL and creating a new one', () => {
    const registry = new ObjectUrlRegistry();
    const first = registry.create(blob());
    const second = registry.replace(first, blob());

    expect(first).toBe('blob:mock-1');
    expect(second).toBe('blob:mock-2');
    expect(registry.has(first)).toBe(false);
    expect(registry.has(second)).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first);
  });

  it('revokes URLs by source and with predicates', () => {
    const registry = new ObjectUrlRegistry();
    registry.create(new File(['a'], 'a.jpg', { type: 'image/jpeg' }), { source: 'file' });
    registry.create(blob(), { source: 'processed' });
    registry.create(blob(), { source: 'blob' });

    expect(registry.revokeBySource('file')).toBe(1);
    expect(registry.revokeWhere(entry => entry.source !== 'blob')).toBe(1);
    expect(registry.getAll()).toHaveLength(1);
  });

  it('revokes the oldest URL when maxUrls is exceeded', () => {
    const registry = new ObjectUrlRegistry({ maxUrls: 2 });
    const first = registry.create(blob());
    const second = registry.create(blob());
    const third = registry.create(blob());

    expect(registry.has(first)).toBe(false);
    expect(registry.has(second)).toBe(true);
    expect(registry.has(third)).toBe(true);
  });

  it('emits created and revoked events and supports unsubscribe', () => {
    const registry = new ObjectUrlRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);

    const url = registry.create(blob());
    registry.revoke(url);

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'created', url }));
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'revoked', url }));

    listener.mockClear();
    unsubscribe();
    registry.create(blob());
    expect(listener).not.toHaveBeenCalled();
  });

  it('disposes by revoking all URLs', () => {
    const registry = new ObjectUrlRegistry();
    registry.create(blob());
    registry.create(blob());

    registry.dispose();

    expect(registry.getAll()).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});

describe('global object URL registry helpers', () => {
  it('returns a singleton and can reset it', () => {
    const first = getGlobalObjectUrlRegistry();
    first.create(blob());
    const same = getGlobalObjectUrlRegistry();
    expect(same).toBe(first);

    resetGlobalObjectUrlRegistry();
    const next = getGlobalObjectUrlRegistry();
    expect(next).not.toBe(first);
    expect(next.getAll()).toHaveLength(0);
  });

  it('safely revokes only blob URLs', () => {
    expect(safeRevokeObjectUrl(undefined)).toBe(false);
    expect(safeRevokeObjectUrl('https://example.com/image.jpg')).toBe(false);
    expect(safeRevokeObjectUrl('blob:ok')).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:ok');
  });
});

describe('temporary and lifecycle helpers', () => {
  it('auto-revokes temporary URLs after ttl', () => {
    vi.useFakeTimers();
    const { url } = createTemporaryObjectUrl(blob(), 1000);

    expect(getGlobalObjectUrlRegistry().has(url)).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(getGlobalObjectUrlRegistry().has(url)).toBe(false);
    vi.useRealTimers();
  });

  it('cancels temporary URLs early', () => {
    vi.useFakeTimers();
    const { url, cancel } = createTemporaryObjectUrl(blob(), 1000);

    cancel();

    expect(getGlobalObjectUrlRegistry().has(url)).toBe(false);
    vi.useRealTimers();
  });

  it('manages a single URL lifecycle and revokes replacements', () => {
    const lifecycle = createObjectUrlLifecycle();
    const first = lifecycle.set(blob());
    const second = lifecycle.set(blob());

    expect(first).toBe('blob:mock-1');
    expect(second).toBe('blob:mock-2');
    expect(getGlobalObjectUrlRegistry().has(first!)).toBe(false);
    expect(lifecycle.get()).toBe(second);
    expect(lifecycle.hasActive()).toBe(true);

    expect(lifecycle.revoke()).toBe(true);
    expect(lifecycle.get()).toBeUndefined();
    expect(lifecycle.hasActive()).toBe(false);
  });
});
