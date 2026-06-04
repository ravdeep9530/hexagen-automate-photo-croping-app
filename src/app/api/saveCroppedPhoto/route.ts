import { randomUUID } from 'crypto';

import { cropImage, getImageDimensions, validateCropParameters } from '../../../lib/image-utils';
import { createStorageClient } from '../../../lib/storage';
import type { ApiErrorResponse, SaveCroppedPhotoRequest, SaveCroppedPhotoResponse } from '../../../types/api';

export const runtime = 'nodejs';

function jsonResponse<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse<ApiErrorResponse>({ message }, status);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseRequestBody(body: unknown): SaveCroppedPhotoRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const candidate = body as Record<string, unknown>;

  if (typeof candidate.imageId !== 'string') {
    return null;
  }

  const { x, y, width, height, aspectRatio } = candidate;

  if (![x, y, width, height, aspectRatio].every(isFiniteNumber)) {
    return null;
  }

  return {
    imageId: candidate.imageId,
    x,
    y,
    width,
    height,
    aspectRatio,
  };
}

function inferExtension(contentType: string | null): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const cropRequest = parseRequestBody(body);

  if (!cropRequest) {
    return errorResponse('imageId, x, y, width, height, and aspectRatio are required and must be valid types', 400);
  }

  const storage = createStorageClient();
  const sourceKey = `uploads/${cropRequest.imageId}`;

  try {
    const sourceImage = await storage.getObject(sourceKey);

    if (!sourceImage) {
      return errorResponse('Source image not found', 404);
    }

    const dimensions = await getImageDimensions(sourceImage.body);
    const validation = validateCropParameters(cropRequest, dimensions);

    if (!validation.valid) {
      return errorResponse(validation.message, 400);
    }

    const croppedBuffer = await cropImage(cropRequest, sourceImage.body);
    const croppedImageId = randomUUID();
    const key = `cropped/${cropRequest.imageId}/${croppedImageId}.${inferExtension(sourceImage.contentType)}`;
    const { url } = await storage.upload({
      body: croppedBuffer,
      contentType: sourceImage.contentType ?? 'image/jpeg',
      key,
    });

    return jsonResponse<SaveCroppedPhotoResponse>({
      croppedImageId,
      url,
      complianceStatus: 'cropped',
    });
  } catch (error) {
    console.error('Failed to save cropped photo', error);
    return errorResponse('Failed to save cropped photo', 500);
  }
}
