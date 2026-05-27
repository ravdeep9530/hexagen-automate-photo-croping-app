import type { ImageAsset, CropState, ProcessingSettings } from '@/domain';
import { applyCanvasTransform, calculateDrawTransform } from '../rendering/canvas-transforms';
import { compositeBackground } from '../rendering/background-compositor';
import { applyImageAdjustments, resetImageAdjustments } from '../rendering/image-adjustments';
import { createPrintable4x6Layout, PRINT_4X6_HEIGHT_PX, PRINT_4X6_WIDTH_PX } from './sheet-layout';

export type ExportMode = 'single' | 'sheet-4x6';
export type SupportedExportFormat = 'png' | 'jpeg';

export interface ExportRenderWarning {
  code: 'dpi-metadata-limited' | 'copies-clipped' | 'canvas-memory-limit' | 'encoding-failed';
  message: string;
}

export interface ExportRendererAdapters {
  createCanvas?: (width: number, height: number) => HTMLCanvasElement;
  loadImage?: (asset: ImageAsset, signal?: AbortSignal) => Promise<CanvasImageSource>;
  maxCanvasPixels?: number;
}

export interface ExportRenderRequest {
  asset: ImageAsset;
  crop: CropState;
  processing: ProcessingSettings;
  mode: ExportMode;
  format: SupportedExportFormat;
  widthPx: number;
  heightPx: number;
  jpegQuality?: number;
  copies?: number;
  includeCutLines?: boolean;
  includeLabels?: boolean;
  label?: string;
  signal?: AbortSignal;
}

export interface ExportRenderResult {
  blob: Blob;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  mimeType: string;
  warnings: ExportRenderWarning[];
}

const DPI_WARNING: ExportRenderWarning = {
  code: 'dpi-metadata-limited',
  message: 'Browsers export canvas pixels without reliable 300 DPI metadata. The pixel dimensions are correct; set print size to 4x6 inches when printing.',
};

function getMimeType(format: SupportedExportFormat): string {
  return format === 'jpeg' ? 'image/jpeg' : 'image/png';
}

function defaultCreateCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === 'undefined') throw new Error('Canvas is unavailable outside the browser.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function defaultLoadImage(asset: ImageAsset, signal?: AbortSignal): Promise<CanvasImageSource> {
  if (signal?.aborted) throw new DOMException('Export aborted.', 'AbortError');
  if (!asset.blobUrl) throw new Error('Image asset does not include a browser object URL.');
  const image = new Image();
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Browser failed to decode the image.'));
    signal?.addEventListener('abort', () => reject(new DOMException('Export aborted.', 'AbortError')), { once: true });
  });
  image.src = asset.blobUrl;
  return loaded;
}

function getImageDimensions(image: CanvasImageSource, asset: ImageAsset): { width: number; height: number } {
  const candidate = image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number; videoWidth?: number; videoHeight?: number };
  return {
    width: candidate.naturalWidth ?? candidate.videoWidth ?? candidate.width ?? asset.metadata.width,
    height: candidate.naturalHeight ?? candidate.videoHeight ?? candidate.height ?? asset.metadata.height,
  };
}

function encodeCanvas(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas encoding failed. The image may exceed browser memory limits.'));
      },
      mimeType,
      quality,
    );
  });
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageDimensions: { width: number; height: number },
  crop: CropState,
  processing: ProcessingSettings,
  target: { x: number; y: number; width: number; height: number },
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(target.x, target.y, target.width, target.height);
  ctx.clip();
  ctx.translate(target.x, target.y);
  compositeBackground(ctx, target.width, target.height, processing);
  const transform = calculateDrawTransform(imageDimensions.width, imageDimensions.height, crop, { width: target.width, height: target.height });
  applyCanvasTransform(ctx, transform);
  applyImageAdjustments(ctx, processing);
  ctx.drawImage(image, 0, 0, imageDimensions.width, imageDimensions.height);
  resetImageAdjustments(ctx);
  ctx.restore();
}

function drawCutLines(ctx: CanvasRenderingContext2D, target: { x: number; y: number; width: number; height: number }): void {
  ctx.save();
  ctx.strokeStyle = '#9ca3af';
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.strokeRect(target.x, target.y, target.width, target.height);
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, target: { x: number; y: number; width: number; height: number }): void {
  ctx.save();
  ctx.fillStyle = '#111827';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, target.x + target.width / 2, Math.min(target.y + target.height + 28, PRINT_4X6_HEIGHT_PX - 16));
  ctx.restore();
}

export async function renderExport(request: ExportRenderRequest, adapters: ExportRendererAdapters = {}): Promise<ExportRenderResult> {
  const warnings: ExportRenderWarning[] = [DPI_WARNING];
  const mimeType = getMimeType(request.format);
  const width = request.mode === 'sheet-4x6' ? PRINT_4X6_WIDTH_PX : request.widthPx;
  const height = request.mode === 'sheet-4x6' ? PRINT_4X6_HEIGHT_PX : request.heightPx;
  const maxPixels = adapters.maxCanvasPixels ?? 64_000_000;

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Export dimensions must be positive whole pixels.');
  }
  if (width * height > maxPixels) {
    warnings.push({ code: 'canvas-memory-limit', message: 'The requested export exceeds the configured browser canvas memory limit.' });
    throw new Error('Canvas memory limit exceeded for export.');
  }

  const createCanvas = adapters.createCanvas ?? defaultCreateCanvas;
  const loadImage = adapters.loadImage ?? defaultLoadImage;
  const canvas = createCanvas(width, height);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser did not provide a 2D canvas context.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  const image = await loadImage(request.asset, request.signal);
  if (request.signal?.aborted) throw new DOMException('Export aborted.', 'AbortError');
  const imageDimensions = getImageDimensions(image, request.asset);

  if (request.mode === 'single') {
    drawPhoto(ctx, image, imageDimensions, request.crop, request.processing, { x: 0, y: 0, width, height });
  } else {
    const layout = createPrintable4x6Layout({ photoSize: { width: request.widthPx, height: request.heightPx }, copies: request.copies ?? 4 });
    if (layout.renderedCopies < layout.requestedCopies) warnings.push({ code: 'copies-clipped', message: `Only ${layout.renderedCopies} of ${layout.requestedCopies} copies fit on a 4x6 sheet.` });
    for (const placement of layout.placements) {
      drawPhoto(ctx, image, imageDimensions, request.crop, request.processing, placement);
      if (request.includeCutLines) drawCutLines(ctx, placement);
      if (request.includeLabels) drawLabel(ctx, request.label ?? 'Passport photo', placement);
    }
  }

  try {
    const blob = await encodeCanvas(canvas, mimeType, request.format === 'jpeg' ? request.jpegQuality ?? 0.92 : undefined);
    return { blob, canvas, width, height, mimeType, warnings };
  } catch (error) {
    warnings.push({ code: 'encoding-failed', message: error instanceof Error ? error.message : 'Canvas encoding failed.' });
    throw error;
  }
}
