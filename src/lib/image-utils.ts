import sharp from 'sharp';

import { uploadToS3 as uploadBufferToS3 } from './s3-storage';
import type { CropParameters } from '../types/crop-parameters';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const CROP_ASPECT_RATIO_TOLERANCE = 0.01;
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

export interface CropValidationResult {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format?: string;
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

export async function getImageMetadata(file: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(file).metadata();

  if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
    throw new Error('Unable to determine image dimensions.');
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

export function validateCropBounds(params: CropParameters, image: { width: number; height: number }): CropValidationResult {
  const width = Math.round(params.width);
  const height = Math.round(params.height);
  const left = Math.round(params.x);
  const top = Math.round(params.y);

  if ([width, height, left, top, params.aspectRatio].some((value) => !Number.isFinite(value))) {
    throw new Error('Crop parameters must be valid numbers.');
  }

  if (left < 0 || top < 0) {
    throw new Error('Crop coordinates must be greater than or equal to zero.');
  }

  if (width <= 0 || height <= 0) {
    throw new Error('Crop width and height must be greater than zero.');
  }

  if (left + width > image.width || top + height > image.height) {
    throw new Error('Crop area exceeds the image bounds.');
  }

  const actualAspectRatio = width / height;
  if (Math.abs(actualAspectRatio - params.aspectRatio) > CROP_ASPECT_RATIO_TOLERANCE) {
    throw new Error('Crop aspect ratio does not match the requested aspect ratio.');
  }

  return { width, height, left, top };
}

export async function cropImage(params: CropParameters, file: Buffer): Promise<Buffer> {
  const metadata = await getImageMetadata(file);
  const { width, height, left, top } = validateCropBounds(params, metadata);

  return sharp(file)
    .extract({ left, top, width, height })
    .jpeg()
    .toBuffer();
}

export async function uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
  return uploadBufferToS3({
    buffer,
    key: filename,
    contentType: 'image/jpeg',
  });
}
