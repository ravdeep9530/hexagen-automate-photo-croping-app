import { randomUUID } from 'crypto';

import { createApiError, ApiRouteError, formatApiErrorResponse } from '../../../lib/error-utils';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES, validateImageUpload } from '../../../lib/image-utils';
import { uploadToS3 } from '../../../lib/s3-storage';
import type { UploadPhotoResponse } from '../../../types/api';

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function getExtensionForMimeType(mimetype: string): string {
  if (mimetype === 'image/png') {
    return 'png';
  }

  return 'jpg';
}

async function parseUploadRequest(request: Request): Promise<{ sessionId: string; file: File }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    throw createApiError(400, 'INVALID_FORM_DATA', 'Request must use multipart/form-data.');
  }

  const formData = await request.formData();
  const sessionIdValue = formData.get('sessionId');
  const fileValue = formData.get('file') ?? formData.get('image');

  const sessionId = typeof sessionIdValue === 'string' ? sessionIdValue.trim() : '';
  if (!sessionId) {
    throw createApiError(400, 'INVALID_FORM_DATA', 'sessionId is required.');
  }

  if (!(fileValue instanceof File)) {
    throw createApiError(400, 'INVALID_FORM_DATA', 'An image file is required.');
  }

  return { sessionId, file: fileValue };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { sessionId, file } = await parseUploadRequest(request);
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = await validateImageUpload(buffer, file.type);

    if (!validation.ok) {
      if (validation.reason === 'too_large') {
        throw createApiError(413, 'FILE_TOO_LARGE', `Image must be ${MAX_IMAGE_SIZE_BYTES} bytes or smaller.`);
      }

      if (validation.reason === 'unsupported_type') {
        throw createApiError(
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          `Only ${ALLOWED_IMAGE_MIME_TYPES.join(' and ')} files are supported.`,
        );
      }

      throw createApiError(400, 'INVALID_FORM_DATA', 'The uploaded file is not a valid image.');
    }

    const imageId = randomUUID();
    const extension = getExtensionForMimeType(file.type);
    const key = `${sessionId}/${imageId}.${extension}`;
    const url = await uploadToS3({
      buffer,
      key,
      contentType: file.type,
    });

    const response: UploadPhotoResponse = {
      sessionId,
      imageId,
      url,
    };

    return json(response, 200);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return json(formatApiErrorResponse(error), error.status);
    }

    return json(
      formatApiErrorResponse(createApiError(500, 'UPLOAD_FAILED', 'Failed to upload image. Please try again.')),
      500,
    );
  }
}
