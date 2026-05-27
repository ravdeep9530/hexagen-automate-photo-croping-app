import type { ValidationIssue } from '@/domain';
import { createUploadValidationIssue, ValidationErrorCodes } from './upload-validation';

export interface DecodedImage {
  width: number;
  height: number;
  imageBitmap?: ImageBitmap;
  objectUrl: string;
}

export interface DecodeResult {
  success: boolean;
  image?: DecodedImage;
  issues: ValidationIssue[];
}

export interface DecodeOptions {
  signal?: AbortSignal;
  preferImageBitmap?: boolean;
}

export function isImageBitmapSupported(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.createImageBitmap === 'function';
}

export async function decodeImageFile(file: File, options?: DecodeOptions): Promise<DecodeResult> {
  if (options?.signal?.aborted) throw new DOMException('Image decoding was aborted', 'AbortError');

  if (isImageBitmapSupported() && options?.preferImageBitmap !== false) {
    try {
      const imageBitmap = await globalThis.createImageBitmap(file);
      if (options?.signal?.aborted) {
        imageBitmap.close?.();
        throw new DOMException('Image decoding was aborted', 'AbortError');
      }
      return {
        success: true,
        image: {
          width: imageBitmap.width,
          height: imageBitmap.height,
          imageBitmap,
          objectUrl: URL.createObjectURL(file),
        },
        issues: [],
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      return {
        success: false,
        issues: [createUploadValidationIssue(
          ValidationErrorCodes.DECODE_FAILED,
          'The image could not be decoded with ImageBitmap.',
          { error: error instanceof Error ? error.message : String(error) }
        )],
      };
    }
  }

  if (typeof Image === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    return {
      success: false,
      issues: [createUploadValidationIssue(
        ValidationErrorCodes.API_UNSUPPORTED,
        'This browser does not provide an image decoding API.',
        { requiredApis: ['createImageBitmap or HTMLImageElement', 'URL.createObjectURL'] }
      )],
    };
  }

  return new Promise(resolve => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
    };
    const abort = () => {
      cleanup();
      URL.revokeObjectURL(objectUrl);
      throw new DOMException('Image decoding was aborted', 'AbortError');
    };
    if (options?.signal?.aborted) abort();
    image.onload = () => {
      cleanup();
      resolve({ success: true, image: { width: image.naturalWidth, height: image.naturalHeight, objectUrl }, issues: [] });
    };
    image.onerror = () => {
      cleanup();
      URL.revokeObjectURL(objectUrl);
      resolve({ success: false, issues: [createUploadValidationIssue(ValidationErrorCodes.DECODE_FAILED, 'The image could not be decoded.')] });
    };
    image.src = objectUrl;
  });
}

export function cleanupDecodedImage(image: DecodedImage): void {
  if (image.objectUrl) URL.revokeObjectURL(image.objectUrl);
  image.imageBitmap?.close?.();
}
