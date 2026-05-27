import type { ValidationIssue } from '@/domain';
import { assertLocalFileOrThrow, rejectRemoteUrl } from '@/lib/security/local-file-guards';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_DIMENSION_PX = 8000;

export const ValidationErrorCodes = {
  MIME_TYPE_INVALID: 'MIME_TYPE_INVALID',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  DIMENSIONS_TOO_LARGE: 'DIMENSIONS_TOO_LARGE',
  DECODE_FAILED: 'DECODE_FAILED',
  API_UNSUPPORTED: 'API_UNSUPPORTED',
  REMOTE_URL_REJECTED: 'REMOTE_URL_REJECTED',
} as const;
export type ValidationErrorCode = (typeof ValidationErrorCodes)[keyof typeof ValidationErrorCodes];

type UploadRuleType = ValidationIssue['type'];

const ruleTypeForCode: Record<ValidationErrorCode, UploadRuleType> = {
  MIME_TYPE_INVALID: 'format',
  FILE_TOO_LARGE: 'file-size',
  DIMENSIONS_TOO_LARGE: 'dimension',
  DECODE_FAILED: 'format',
  API_UNSUPPORTED: 'custom',
  REMOTE_URL_REJECTED: 'custom',
};

export interface FileValidationResult {
  valid: boolean;
  file: File;
  mimeType: string;
  issues: ValidationIssue[];
}

export interface ImageValidationResult {
  valid: boolean;
  width: number;
  height: number;
  issues: ValidationIssue[];
}

export interface UploadValidationResult {
  valid: boolean;
  file?: File;
  mimeType?: string;
  width?: number;
  height?: number;
  imageBitmap?: ImageBitmap;
  issues: ValidationIssue[];
}

export function createUploadValidationIssue(
  code: ValidationErrorCode,
  message: string,
  details?: Record<string, unknown>
): ValidationIssue {
  return {
    ruleId: `upload.${code.toLowerCase()}`,
    type: ruleTypeForCode[code],
    severity: 'error',
    message,
    details: { code, ...details },
    checkedAt: new Date().toISOString(),
  };
}

export const createValidationIssue = createUploadValidationIssue;

export function isSupportedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase() as AllowedMimeType);
}

export function validateLocalUploadSource(input: unknown): { valid: true; file: File; issues: [] } | { valid: false; issues: ValidationIssue[] } {
  const guard = rejectRemoteUrl(input);
  if (guard.type === 'safe') return { valid: true, file: guard.file, issues: [] };
  return {
    valid: false,
    issues: [createUploadValidationIssue(
      ValidationErrorCodes.REMOTE_URL_REJECTED,
      guard.reason,
      { inputType: typeof input }
    )],
  };
}

export function validateMimeType(file: File): FileValidationResult {
  const localFile = assertLocalFileOrThrow(file);
  const mimeType = localFile.type.toLowerCase();
  if (!isSupportedMimeType(mimeType)) {
    return {
      valid: false,
      file: localFile,
      mimeType,
      issues: [createUploadValidationIssue(
        ValidationErrorCodes.MIME_TYPE_INVALID,
        `Unsupported image type. Upload a JPEG, PNG, or WEBP image.`,
        { receivedMimeType: mimeType, allowedMimeTypes: [...ALLOWED_MIME_TYPES] }
      )],
    };
  }
  return { valid: true, file: localFile, mimeType, issues: [] };
}

export function validateFileSize(file: File): FileValidationResult {
  const localFile = assertLocalFileOrThrow(file);
  if (localFile.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      file: localFile,
      mimeType: localFile.type,
      issues: [createUploadValidationIssue(
        ValidationErrorCodes.FILE_TOO_LARGE,
        `File is too large. Upload an image up to 20 MB.`,
        { fileSizeBytes: localFile.size, maxFileSizeBytes: MAX_FILE_SIZE_BYTES }
      )],
    };
  }
  return { valid: true, file: localFile, mimeType: localFile.type, issues: [] };
}

export function validateImageDimensions(width: number, height: number): ImageValidationResult {
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    return {
      valid: false,
      width,
      height,
      issues: [createUploadValidationIssue(
        ValidationErrorCodes.DIMENSIONS_TOO_LARGE,
        `Image dimensions exceed the maximum ${MAX_DIMENSION_PX}×${MAX_DIMENSION_PX} pixels.`,
        { width, height, maxWidth: MAX_DIMENSION_PX, maxHeight: MAX_DIMENSION_PX }
      )],
    };
  }
  return { valid: true, width, height, issues: [] };
}

export function isCreateImageBitmapSupported(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.createImageBitmap === 'function';
}

export async function decodeImage(
  file: File,
  signal?: AbortSignal
): Promise<{ width: number; height: number; imageBitmap?: ImageBitmap }> {
  const localFile = assertLocalFileOrThrow(file);
  if (signal?.aborted) throw new DOMException('Image decoding was aborted', 'AbortError');

  if (isCreateImageBitmapSupported()) {
    const imageBitmap = await globalThis.createImageBitmap(localFile);
    if (signal?.aborted) {
      imageBitmap.close?.();
      throw new DOMException('Image decoding was aborted', 'AbortError');
    }
    return { width: imageBitmap.width, height: imageBitmap.height, imageBitmap };
  }

  if (typeof Image === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw createUploadValidationIssue(
      ValidationErrorCodes.API_UNSUPPORTED,
      'This browser cannot decode local images because required image APIs are unavailable.',
      { requiredApis: ['createImageBitmap or HTMLImageElement', 'URL.createObjectURL'] }
    );
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(localFile);
    const img = new Image();
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      URL.revokeObjectURL(url);
    };
    const onAbort = () => {
      cleanup();
      img.src = '';
      reject(new DOMException('Image decoding was aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    img.onload = () => {
      cleanup();
      signal?.removeEventListener('abort', onAbort);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      cleanup();
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('Failed to decode image file'));
    };
    img.src = url;
  });
}

export async function validateUpload(input: File | unknown, options?: { signal?: AbortSignal; skipDecode?: boolean }): Promise<UploadValidationResult> {
  const localSource = validateLocalUploadSource(input);
  if (!localSource.valid) return { valid: false, issues: localSource.issues };
  const file = localSource.file;
  const mime = validateMimeType(file);
  if (!mime.valid) return { valid: false, issues: mime.issues };
  const size = validateFileSize(file);
  if (!size.valid) return { valid: false, mimeType: mime.mimeType, issues: size.issues };
  if (options?.skipDecode) return { valid: true, file, mimeType: mime.mimeType, issues: [] };

  try {
    const decoded = await decodeImage(file, options?.signal);
    const dimensions = validateImageDimensions(decoded.width, decoded.height);
    if (!dimensions.valid) {
      decoded.imageBitmap?.close?.();
      return { valid: false, file, mimeType: mime.mimeType, width: decoded.width, height: decoded.height, issues: dimensions.issues };
    }
    return { valid: true, file, mimeType: mime.mimeType, width: decoded.width, height: decoded.height, imageBitmap: decoded.imageBitmap, issues: [] };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    const issue = isValidationIssue(error) ? error : createUploadValidationIssue(
      ValidationErrorCodes.DECODE_FAILED,
      'The image could not be decoded. It may be corrupted or unsupported by this browser.',
      { error: error instanceof Error ? error.message : String(error) }
    );
    return { valid: false, file, mimeType: mime.mimeType, issues: [issue] };
  }
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return typeof value === 'object' && value !== null && 'ruleId' in value && 'checkedAt' in value;
}

export async function validateMultipleUploads(files: File[], options?: { signal?: AbortSignal; skipDecode?: boolean }): Promise<UploadValidationResult[]> {
  const results: UploadValidationResult[] = [];
  for (const file of files) results.push(await validateUpload(file, options));
  return results;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Number((bytes / 1024 ** index).toFixed(2))} ${units[index]}`;
}

export function getAcceptedFileTypes(): string {
  return ALLOWED_MIME_TYPES.join(',');
}
