import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderExport } from '../export-renderer';
import { generateExportFilename } from '../filename';
import { PRINT_4X6_HEIGHT_PX, PRINT_4X6_WIDTH_PX } from '../sheet-layout';

vi.mock('../../rendering/canvas-transforms', () => ({
  calculateDrawTransform: vi.fn(() => ({ translateX: 0, translateY: 0, scale: 1, rotation: 0, flipHorizontal: false, flipVertical: false })),
  applyCanvasTransform: vi.fn(),
}));

vi.mock('../../rendering/background-compositor', () => ({
  compositeBackground: vi.fn(),
}));

vi.mock('../../rendering/image-adjustments', () => ({
  applyImageAdjustments: vi.fn(),
  resetImageAdjustments: vi.fn(),
}));

class FakeContext {
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  font = '';
  textAlign = '';
  drawImage = vi.fn();
  fillRect = vi.fn();
  clearRect = vi.fn();
  save = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  translate = vi.fn();
  setLineDash = vi.fn();
  strokeRect = vi.fn();
  fillText = vi.fn();
}

class FakeCanvas {
  width: number;
  height: number;
  context = new FakeContext();
  toBlobCalls: Array<{ mimeType: string; quality?: number }> = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(type: string) {
    return type === '2d' ? this.context : null;
  }

  toBlob(callback: (blob: Blob | null) => void, mimeType: string, quality?: number) {
    this.toBlobCalls.push({ mimeType, quality });
    callback(new Blob([`${this.width}x${this.height}`], { type: mimeType }));
  }
}

function asset() {
  return {
    id: 'asset-1',
    blobUrl: 'blob:asset-1',
    metadata: { width: 1200, height: 1600, fileName: 'source.jpg', fileSize: 10, mimeType: 'image/jpeg' },
  } as any;
}

function crop() {
  return { x: 0, y: 0, width: 1200, height: 1600, rotation: 0, scale: 1, flipHorizontal: false, flipVertical: false } as any;
}

function processing() {
  return { brightness: 0, contrast: 0, saturation: 0, sharpness: 0, background: { mode: 'original' }, skinSmoothing: 0, redEyeReduction: false, autoEnhance: false, grayscale: false } as any;
}

function adapters(canvases: FakeCanvas[] = []) {
  return {
    createCanvas: (width: number, height: number) => {
      const canvas = new FakeCanvas(width, height);
      canvases.push(canvas);
      return canvas as unknown as HTMLCanvasElement;
    },
    loadImage: vi.fn(async () => ({ width: 1200, height: 1600 }) as unknown as CanvasImageSource),
  };
}

describe('renderExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a single photo at selected preset pixel dimensions', async () => {
    const canvases: FakeCanvas[] = [];
    const result = await renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'single',
      format: 'png',
      widthPx: 600,
      heightPx: 800,
    }, adapters(canvases));

    expect(result.width).toBe(600);
    expect(result.height).toBe(800);
    expect(result.canvas.width).toBe(600);
    expect(result.canvas.height).toBe(800);
    expect(canvases[0].context.drawImage).toHaveBeenCalledTimes(1);
  });

  it('selects PNG MIME type and does not apply JPEG quality to PNG', async () => {
    const canvases: FakeCanvas[] = [];
    const result = await renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'single',
      format: 'png',
      widthPx: 300,
      heightPx: 400,
      jpegQuality: 0.5,
    }, adapters(canvases));

    expect(result.mimeType).toBe('image/png');
    expect(result.blob.type).toBe('image/png');
    expect(canvases[0].toBlobCalls[0]).toEqual({ mimeType: 'image/png', quality: undefined });
  });

  it('selects JPEG MIME type and applies quality only for JPEG exports', async () => {
    const canvases: FakeCanvas[] = [];
    const result = await renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'single',
      format: 'jpeg',
      widthPx: 300,
      heightPx: 400,
      jpegQuality: 0.73,
    }, adapters(canvases));

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.blob.type).toBe('image/jpeg');
    expect(canvases[0].toBlobCalls[0]).toEqual({ mimeType: 'image/jpeg', quality: 0.73 });
  });

  it('renders printable 4x6 sheets at 1800x1200 and draws configured copies', async () => {
    const canvases: FakeCanvas[] = [];
    const result = await renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'sheet-4x6',
      format: 'jpeg',
      widthPx: 400,
      heightPx: 500,
      copies: 4,
      includeCutLines: true,
      includeLabels: true,
    }, adapters(canvases));

    expect(result.width).toBe(PRINT_4X6_WIDTH_PX);
    expect(result.height).toBe(PRINT_4X6_HEIGHT_PX);
    expect(canvases[0].context.drawImage).toHaveBeenCalledTimes(4);
    expect(canvases[0].context.strokeRect).toHaveBeenCalledTimes(4);
    expect(canvases[0].context.fillText).toHaveBeenCalledTimes(4);
  });

  it('adds clipped copy warnings when requested copies exceed layout capacity', async () => {
    const result = await renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'sheet-4x6',
      format: 'png',
      widthPx: 600,
      heightPx: 800,
      copies: 99,
    }, adapters());

    expect(result.warnings.some((warning) => warning.code === 'copies-clipped')).toBe(true);
  });

  it('includes browser DPI metadata limitation warnings', async () => {
    const result = await renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'single',
      format: 'png',
      widthPx: 600,
      heightPx: 800,
    }, adapters());

    expect(result.warnings.some((warning) => warning.code === 'dpi-metadata-limited')).toBe(true);
  });

  it('throws when canvas memory limits are exceeded', async () => {
    await expect(renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'single',
      format: 'png',
      widthPx: 10_000,
      heightPx: 10_000,
    }, { ...adapters(), maxCanvasPixels: 1_000 })).rejects.toThrow('Canvas memory limit exceeded for export.');
  });

  it('throws for invalid export dimensions', async () => {
    await expect(renderExport({
      asset: asset(),
      crop: crop(),
      processing: processing(),
      mode: 'single',
      format: 'png',
      widthPx: 0,
      heightPx: 800,
    }, adapters())).rejects.toThrow('Export dimensions must be positive whole pixels.');
  });
});

describe('generateExportFilename', () => {
  it('generates sanitized filenames with mode, date, and extension', () => {
    const filename = generateExportFilename({
      baseName: 'My Passport Photo!',
      presetName: 'Canada Passport',
      mode: 'sheet-4x6',
      format: 'jpeg',
      now: new Date('2026-01-02T03:04:05Z'),
    });

    expect(filename).toBe('my-passport-photo-canada-passport-4x6-sheet-2026-01-02.jpg');
  });

  it('uses png extension for PNG exports', () => {
    expect(generateExportFilename({ format: 'png', now: new Date('2026-01-02T00:00:00Z') })).toBe('passport-photo-single-2026-01-02.png');
  });
});
