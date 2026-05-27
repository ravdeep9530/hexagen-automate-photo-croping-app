import type { ImageAsset } from '@/domain/assets';
import { compositeBackground } from './background-compositor';
import { applyCanvasTransform, calculateDrawTransform, calculatePreviewDimensions, validateCrop } from './canvas-transforms';
import type { CanvasLike, PreviewRendererAdapters, PreviewRenderRequest, PreviewRenderResult, PreviewValidationIssue } from './canvas-types';
import { applyImageAdjustments, resetImageAdjustments } from './image-adjustments';
import { isAbortError, throwIfAborted } from './render-abort-controller';

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function defaultCreateCanvas(width: number, height: number): CanvasLike {
  if (typeof document === 'undefined') {
    throw new Error('Canvas is unavailable outside a browser document.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Validates that an image source won't taint the canvas.
 * 
 * Tainted canvas protection:
 * - Rejects remote HTTP/HTTPS image sources
 * - Only allows same-origin, blob URLs (object URLs), and data URIs
 * - Prevents CORS issues and ensures canvas remains extractable
 */
function isSafeImageSource(source: string): boolean {
  if (!source || typeof source !== 'string') {
    return false;
  }
  
  // Allow relative URLs (same origin)
  if (!source.includes(':') || source.startsWith('/')) {
    return true;
  }
  
  const lowerSource = source.toLowerCase().trim();
  
  // Allow blob URLs (object URLs created from local files)
  // These are always safe as they originate from the same page context
  if (lowerSource.startsWith('blob:')) {
    return true;
  }
  
  // Allow data URIs (base64 encoded images from canvas)
  if (lowerSource.startsWith('data:')) {
    return true;
  }
  
  // Reject all remote protocols to prevent canvas tainting
  // http:, https:, ftp:, etc. would make the canvas "tainted"
  // and break toDataURL(), toBlob(), and getImageData()
  return false;
}

async function defaultLoadImage(asset: ImageAsset, signal?: AbortSignal): Promise<CanvasImageSource> {
  throwIfAborted(signal);
  const source = asset.blobUrl;
  if (!source) {
    throw new Error('Image asset does not include a browser object URL.');
  }

  // Security check: ensure we only load safe (non-remote) sources
  // This prevents canvas tainting which would break export functionality
  if (!isSafeImageSource(source)) {
    throw new Error(
      'Cannot load remote image sources. Only local files loaded via object URLs or data URIs are supported.'
    );
  }

  const image = new Image();
  image.decoding = 'async';
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
    };
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('Browser failed to decode the image.'));
    };
    signal?.addEventListener('abort', () => {
      cleanup();
      image.src = '';
      reject(new DOMException('Preview render aborted.', 'AbortError'));
    }, { once: true });
  });
  image.src = source;
  return loaded;
}

function canvasToBlob(canvas: CanvasLike, mimeType: string, quality: number): Promise<Blob> {
  if (canvas.toBlob) {
    return new Promise((resolve, reject) => {
      canvas.toBlob?.((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas returned an empty blob.'));
      }, mimeType, quality);
    });
  }

  if (!canvas.toDataURL) {
    return Promise.reject(new Error('Canvas encoding is unavailable.'));
  }

  const dataUrl = canvas.toDataURL(mimeType, quality);
  const [header, payload] = dataUrl.split(',');
  const binary = atob(payload ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const type = /data:([^;]+)/.exec(header ?? '')?.[1] ?? mimeType;
  return Promise.resolve(new Blob([bytes], { type }));
}

function getImageDimensions(image: CanvasImageSource, fallback: ImageAsset): { width: number; height: number } {
  const candidate = image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number; videoWidth?: number; videoHeight?: number };
  return {
    width: candidate.naturalWidth ?? candidate.videoWidth ?? candidate.width ?? fallback.metadata.width,
    height: candidate.naturalHeight ?? candidate.videoHeight ?? candidate.height ?? fallback.metadata.height,
  };
}

function errorIssue(code: PreviewValidationIssue['code'], message: string, error?: unknown): PreviewValidationIssue {
  return {
    code,
    message,
    severity: 'error',
    details: error instanceof Error ? { name: error.name, message: error.message } : undefined,
  };
}

/**
 * Renders a preview of the image with the applied processing.
 * 
 * Security notes:
 * - Only accepts blob URLs and data URIs (local sources)
 * - Rejects remote image URLs to prevent canvas tainting
 * - This ensures the canvas can always be exported via toDataURL/toBlob
 */
export async function renderPreview(
  request: PreviewRenderRequest,
  adapters: PreviewRendererAdapters = {},
): Promise<PreviewRenderResult> {
  const now = adapters.now ?? defaultNow;
  const startedAt = now();
  const validationIssues: PreviewValidationIssue[] = [];
  const mimeType = request.mimeType ?? 'image/png';
  const quality = request.quality ?? 0.92;

  const { dimensions, issues } = calculatePreviewDimensions(request.presetDimensions, request.maxPreviewPixels);
  validationIssues.push(...issues, ...validateCrop(request.crop));

  const fatal = validationIssues.find((issue) => issue.severity === 'error');
  if (fatal) {
    return { width: dimensions.width, height: dimensions.height, validationIssues, renderTimeMs: now() - startedAt, aborted: false };
  }

  try {
    throwIfAborted(request.signal);

    const createCanvas = adapters.createCanvas ?? defaultCreateCanvas;
    const loadImage = adapters.loadImage ?? defaultLoadImage;
    const canvas = createCanvas(dimensions.width, dimensions.height);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      validationIssues.push(errorIssue('canvas-unavailable', 'Browser did not provide a 2D canvas context.'));
      return { width: dimensions.width, height: dimensions.height, validationIssues, renderTimeMs: now() - startedAt, aborted: false };
    }

    const image = await loadImage(request.asset, request.signal);
    throwIfAborted(request.signal);

    const imageDimensions = getImageDimensions(image, request.asset);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    compositeBackground(ctx, dimensions.width, dimensions.height, request.processing);

    ctx.save();
    const transform = calculateDrawTransform(imageDimensions.width, imageDimensions.height, request.crop, dimensions);
    applyCanvasTransform(ctx, transform);
    applyImageAdjustments(ctx, request.processing);
    ctx.drawImage(image, 0, 0, imageDimensions.width, imageDimensions.height);
    resetImageAdjustments(ctx);
    ctx.restore();

    throwIfAborted(request.signal);

    let url: string;
    if (request.output === 'data-url') {
      if (!canvas.toDataURL) throw new Error('Canvas data URL encoding is unavailable.');
      url = canvas.toDataURL(mimeType, quality);
    } else {
      const blob = await canvasToBlob(canvas, mimeType, quality);
      throwIfAborted(request.signal);
      const createObjectUrl = adapters.createObjectUrl ?? URL.createObjectURL.bind(URL);
      url = createObjectUrl(blob);
    }

    return { url, width: dimensions.width, height: dimensions.height, validationIssues, renderTimeMs: now() - startedAt, aborted: false };
  } catch (error) {
    if (isAbortError(error) || request.signal?.aborted) {
      validationIssues.push(errorIssue('aborted', 'Preview render was aborted because a newer edit was requested.', error));
      return { width: dimensions.width, height: dimensions.height, validationIssues, renderTimeMs: now() - startedAt, aborted: true };
    }

    validationIssues.push(errorIssue('browser-render-failed', 'Browser failed while rendering the preview canvas.', error));
    return { width: dimensions.width, height: dimensions.height, validationIssues, renderTimeMs: now() - startedAt, aborted: false };
  }
}
