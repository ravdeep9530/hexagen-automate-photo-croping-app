import sharp from 'sharp';

import { uploadToS3 as uploadBufferToS3 } from './s3-storage';
import type { CropParameters } from '../types/crop-parameters';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const FORMAT_TO_MIME_TYPE: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export interface ImageValidationResult {
  ok: boolean;
  reason?: 'missing' | 'too_large' | 'unsupported_type' | 'invalid_image';
  width?: number;
  height?: number;
}

export async function validateImage(file: Buffer, mimetype: string): Promise<boolean> {
  const result = await validateImageUpload(file, mimetype);
  return result.ok;
}

export async function validateImageUpload(file: Buffer | null | undefined, mimetype: string): Promise<ImageValidationResult> {
  if (!Buffer.isBuffer(file) || file.length === 0) {
    return { ok: false, reason: 'missing' };
  }

  if (file.length > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, reason: 'too_large' };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return { ok: false, reason: 'unsupported_type' };
  }

  try {
    const metadata = await sharp(file).metadata();
    const detectedMimeType = metadata.format ? FORMAT_TO_MIME_TYPE[metadata.format] : undefined;

    if (!detectedMimeType || detectedMimeType !== mimetype) {
      return { ok: false, reason: 'invalid_image' };
    }

    if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
      return { ok: false, reason: 'invalid_image' };
    }

    return { ok: true, width: metadata.width, height: metadata.height };
  } catch {
    return { ok: false, reason: 'invalid_image' };
  }
}

export async function cropImage(params: CropParameters, file: Buffer): Promise<Buffer> {
  const width = Math.round(params.width);
  const height = Math.round(params.height);
  const left = Math.round(params.x);
  const top = Math.round(params.y);

  if ([width, height, left, top].some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Invalid crop parameters.');
  }

  if (width === 0 || height === 0) {
    throw new Error('Crop width and height must be greater than zero.');
  }

  return sharp(file)
    .extract({ left, top, width, height })
    .toBuffer();
}

export async function uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
  return uploadBufferToS3({
    buffer,
    key: filename,
    contentType: 'image/jpeg',
  });
}
