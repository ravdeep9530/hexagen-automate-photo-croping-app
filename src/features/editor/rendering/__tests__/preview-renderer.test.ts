import { describe, expect, it, vi } from 'vitest';
import type { ImageAsset } from '@/domain/assets';
import { getBackgroundFillStyle } from '../background-compositor';
import { buildCanvasFilter, adjustChannel } from '../image-adjustments';
import { renderPreview } from '../preview-renderer';

function asset(): ImageAsset {
  return {
    id: 'asset-1',
    name: 'photo.png',
    blobUrl: 'blob:photo',
    metadata: {
      width: 800,
      height: 600,
      aspectRatio: 800 / 600,
      format: 'png',
      colorMode: 'rgba',
      hasAlpha: true,
      fileSizeBytes: 1024,
    },
    status: 'valid',
    uploadedAt: '2024-01-01T00:00:00.000Z',
  };
}

function processing(overrides = {}) {
  return {
    brightness: 0.2,
    contrast: -0.1,
    saturation: 0,
    sharpness: 0,
    background: { mode: 'white' as const },
    skinSmoothing: 0,
    redEyeReduction: false,
    autoEnhance: false,
    grayscale: false,
    ...overrides,
  };
}

function crop(overrides = {}) {
  return {
    x: 100,
    y: 50,
    width: 200,
    height: 250,
    rotation: 0,
    scale: 1,
    ...overrides,
  };
}

function createMockCanvas() {
  const calls: string[] = [];
  const ctx = {
    filter: 'none',
    fillStyle: '',
    globalCompositeOperation: 'source-over',
    clearRect: vi.fn(() => calls.push('clearRect')),
    fillRect: vi.fn(() => calls.push('fillRect')),
    save: vi.fn(() => calls.push('save')),
    restore: vi.fn(() => calls.push('restore')),
    translate: vi.fn(() => calls.push('translate')),
    scale: vi.fn(() => calls.push('scale')),
    rotate: vi.fn(() => calls.push('rotate')),
    drawImage: vi.fn(() => calls.push('drawImage')),
  } as unknown as CanvasRenderingContext2D;

  const canvas = {
    width: 0,
    height: 0,
    calls,
    ctx,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((callback: (blob: Blob | null) => void) => callback(new Blob(['preview'], { type: 'image/png' }))),
    toDataURL: vi.fn(() => 'data:image/png;base64,cHJldmlldw=='),
  };

  return canvas;
}

describe('image adjustments and background compositing', () => {
  it('builds deterministic canvas filters for brightness and contrast', () => {
    expect(buildCanvasFilter(processing())).toBe('brightness(120%) contrast(90%)');
    expect(adjustChannel(100, 0.2, 0)).toBeCloseTo(151);
  });

  it('resolves white, solid, and original background modes', () => {
    expect(getBackgroundFillStyle(processing())).toBe('#ffffff');
    expect(getBackgroundFillStyle(processing({ background: { mode: 'solid', color: '#336699' } }))).toBe('#336699');
    expect(getBackgroundFillStyle(processing({ background: { mode: 'original' } }))).toBeUndefined();
  });
});

describe('renderPreview', () => {
  it('renders a preview object URL with background, transforms, adjustments, and dimensions', async () => {
    const canvas = createMockCanvas();
    const createObjectUrl = vi.fn(() => 'blob:preview');

    const result = await renderPreview({
      asset: asset(),
      presetDimensions: { width: 400, height: 500 },
      crop: crop({ rotation: 15, scale: 1.25 }),
      processing: processing(),
      maxPreviewPixels: 1_000_000,
    }, {
      createCanvas: vi.fn(() => canvas),
      loadImage: vi.fn(async () => ({ width: 800, height: 600 } as CanvasImageSource)),
      createObjectUrl,
      now: vi.fn().mockReturnValueOnce(10).mockReturnValue(26),
    });

    expect(result).toMatchObject({ url: 'blob:preview', width: 400, height: 500, aborted: false, renderTimeMs: 16 });
    expect(result.validationIssues).toEqual([]);
    expect(canvas.ctx.fillRect).toHaveBeenCalledWith(0, 0, 400, 500);
    expect(canvas.ctx.drawImage).toHaveBeenCalledWith({ width: 800, height: 600 }, 0, 0, 800, 600);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('returns structured memory budget warning when downscaling', async () => {
    const canvas = createMockCanvas();

    const result = await renderPreview({
      asset: asset(),
      presetDimensions: { width: 1000, height: 1000 },
      crop: crop(),
      processing: processing(),
      maxPreviewPixels: 250_000,
      output: 'data-url',
    }, {
      createCanvas: vi.fn(() => canvas),
      loadImage: vi.fn(async () => ({ width: 800, height: 600 } as CanvasImageSource)),
      now: () => 0,
    });

    expect(result.width).toBe(500);
    expect(result.height).toBe(500);
    expect(result.url).toBe('data:image/png;base64,cHJldmlldw==');
    expect(result.validationIssues[0]).toMatchObject({ code: 'memory-budget-exceeded', severity: 'warning' });
  });

  it('aborts stale render requests with a structured issue', async () => {
    const controller = new AbortController();
    const loadImage = vi.fn(async (_asset: ImageAsset, signal?: AbortSignal) => {
      controller.abort();
      signal?.throwIfAborted?.();
      throw new DOMException('Preview render aborted.', 'AbortError');
    });

    const result = await renderPreview({
      asset: asset(),
      presetDimensions: { width: 400, height: 500 },
      crop: crop(),
      processing: processing(),
      maxPreviewPixels: 1_000_000,
      signal: controller.signal,
    }, {
      createCanvas: vi.fn(() => createMockCanvas()),
      loadImage,
      now: () => 0,
    });

    expect(result.aborted).toBe(true);
    expect(result.validationIssues).toContainEqual(expect.objectContaining({ code: 'aborted', severity: 'error' }));
  });

  it('returns structured canvas failures instead of throwing', async () => {
    const result = await renderPreview({
      asset: asset(),
      presetDimensions: { width: 400, height: 500 },
      crop: crop(),
      processing: processing(),
      maxPreviewPixels: 1_000_000,
    }, {
      createCanvas: vi.fn(() => { throw new Error('no memory'); }),
      now: () => 0,
    });

    expect(result.url).toBeUndefined();
    expect(result.validationIssues).toContainEqual(expect.objectContaining({ code: 'browser-render-failed', severity: 'error' }));
  });
});
