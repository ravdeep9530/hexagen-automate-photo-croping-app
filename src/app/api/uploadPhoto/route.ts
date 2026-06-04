import { randomUUID } from 'crypto';

import {
  MAX_UPLOAD_IMAGE_SIZE_BYTES,
  SUPPORTED_UPLOAD_MIME_TYPES,
  isSupportedUploadMimeType,
  validateUploadImageSize,
} from '../../../lib/image-utils';
import { createStorageClient } from '../../../lib/storage';
import type { ApiErrorResponse, UploadPhotoResponse } from '../../../types/api';

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

function getFileExtension(mimeType: string): string {
  return mimeType === 'image/png' ? 'png' : 'jpg';
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return errorResponse('Content-Type must be multipart/form-data', 400);
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return errorResponse('Image file is required', 400);
  }

  if (!file.name || file.size === 0) {
    return errorResponse('Invalid image file', 400);
  }

  if (!isSupportedUploadMimeType(file.type)) {
    return errorResponse(
      `Unsupported file type. Allowed types: ${SUPPORTED_UPLOAD_MIME_TYPES.join(', ')}`,
      415,
    );
  }

  if (!validateUploadImageSize(file.size)) {
    return errorResponse(`File is too large. Maximum size is ${MAX_UPLOAD_IMAGE_SIZE_BYTES} bytes`, 413);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sessionId = randomUUID();
    const imageId = randomUUID();
    const key = `uploads/${sessionId}/${imageId}.${getFileExtension(file.type)}`;
    const storage = createStorageClient();
    const { url } = await storage.upload({
      body: buffer,
      contentType: file.type,
      key,
    });

    return jsonResponse<UploadPhotoResponse>({ sessionId, imageId, url });
  } catch (error) {
    console.error('Failed to upload photo', error);
    return errorResponse('Failed to upload photo', 500);
  }
}
