import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiProcessingError } from '../ai-errors';
import { removeImageBackground, resetBackgroundRemovalLoaderForTests, setBackgroundRemovalModuleLoaderForTests } from '../background-removal';

const removeBackgroundMock = vi.fn();

describe('background removal integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBackgroundRemovalLoaderForTests();
    setBackgroundRemovalModuleLoaderForTests(async () => ({ removeBackground: removeBackgroundMock } as never));
  });

  it('lazy-loads the AI library and returns a client-only processed asset', async () => {
    const source = new Blob(['source'], { type: 'image/png' });
    const output = new Blob(['removed'], { type: 'image/png' });
    removeBackgroundMock.mockResolvedValue(output);

    const result = await removeImageBackground({
      source,
      createObjectUrl: () => 'blob:removed',
    });

    expect(removeBackgroundMock).toHaveBeenCalledWith(source, expect.objectContaining({ progress: expect.any(Function) }));
    expect(result.blob).toBe(output);
    expect(result.objectUrl).toBe('blob:removed');
  });

  it('reports loading, processing, and complete status with progress', async () => {
    const statuses: string[] = [];
    const progresses: number[] = [];
    removeBackgroundMock.mockImplementation(async (_source, config) => {
      config.progress('model', 5, 10);
      return new Blob(['removed']);
    });

    await removeImageBackground({
      source: new Blob(['source']),
      createObjectUrl: () => 'blob:removed',
      onStatus: (status) => statuses.push(status),
      onProgress: (progress) => progresses.push(progress),
    });

    expect(statuses).toEqual(['loading', 'processing', 'complete']);
    expect(progresses).toEqual([0.5]);
  });

  it('cancels without producing stale object URLs', async () => {
    const controller = new AbortController();
    const createObjectUrl = vi.fn(() => 'blob:late');
    removeBackgroundMock.mockImplementation(async () => {
      controller.abort();
      return new Blob(['late']);
    });

    await expect(removeImageBackground({
      source: new Blob(['source']),
      signal: controller.signal,
      createObjectUrl,
    })).rejects.toMatchObject({ code: 'cancelled' });
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('wraps failures with actionable fallback messaging', async () => {
    removeBackgroundMock.mockRejectedValue(new Error('wasm unavailable'));

    await expect(removeImageBackground({ source: new Blob(['source']) })).rejects.toBeInstanceOf(AiProcessingError);
    await expect(removeImageBackground({ source: new Blob(['source']) })).rejects.toMatchObject({
      code: 'processing-failed',
      actionableMessage: expect.stringContaining('original'),
    });
  });
});
