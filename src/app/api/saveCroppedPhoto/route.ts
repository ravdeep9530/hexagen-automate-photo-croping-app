import { randomUUID } from 'crypto';

import { ApiRouteError, createApiError, formatApiErrorResponse } from '../../../lib/error-utils';
import { cropImage, getImageMetadata, uploadToStorage, validateCropBounds } from '../../../lib/image-utils';
import { getObjectFromS3 } from '../../../lib/s3-storage';
import type { SaveCroppedPhotoRequest, SaveCroppedPhotoResponse } from '../../../types/api';
import type { CropParameters } from '../../../types/crop-parameters';

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

async function parseRequest(request: Request): Promise<CropParameters> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw createApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  if (!body || typeof body !== 'object') {
    throw createApiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object.');
  }

  const { imageId, x, y, width, height, aspectRatio } = body as Partial<SaveCroppedPhotoRequest>;

  if (typeof imageId !== 'string' || !imageId.trim()) {
    throw createApiError(400, 'INVALID_REQUEST', 'imageId is required.');
  }

  const numericEntries = { x, y, width, height, aspectRatio };
  for (const [key, value] of Object.entries(numericEntries)) {
    if (!isFiniteNumber(value)) {
      throw createApiError(400, 'INVALID_REQUEST', `${key} must be a finite number.`);
    }
  }

  return {
    imageId: imageId.trim(),
    x,
    y,
    width,
    height,
    aspectRatio,
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const crop = await parseRequest(request);
    const sourceKey = crop.imageId;
    const sourceBuffer = await getObjectFromS3(sourceKey);

    if (!sourceBuffer) {
      throw createApiError(404, 'SOURCE_IMAGE_NOT_FOUND', 'Source image could not be found.');
    }

    let metadata;
    try {
      metadata = await getImageMetadata(sourceBuffer);
      validateCropBounds(crop, metadata);
    } catch (error) {
      if (error instanceof Error) {
        throw createApiError(422, 'INVALID_CROP', error.message);
      }
      throw error;
    }

    let croppedBuffer: Buffer;
    try {
      croppedBuffer = await cropImage(crop, sourceBuffer);
    } catch {
      throw createApiError(500, 'IMAGE_PROCESSING_FAILED', 'Failed to crop image.');
    }

    const croppedImageId = randomUUID();
    const outputKey = `cropped/${croppedImageId}.jpg`;

    let url: string;
    try {
      url = await uploadToStorage(croppedBuffer, outputKey);
    } catch {
      throw createApiError(500, 'STORAGE_UPLOAD_FAILED', 'Failed to store cropped image.');
    }

    const response: SaveCroppedPhotoResponse = {
      croppedImageId,
      url,
      complianceStatus: 'pending',
    };

    return json(response, 200);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return json(formatApiErrorResponse(error), error.status);
    }

    return json(
      formatApiErrorResponse(createApiError(500, 'SAVE_CROPPED_PHOTO_FAILED', 'Failed to save cropped photo.')),
      500,
    );
  }
}
