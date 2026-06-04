import { ApiRouteError, createApiError, formatApiErrorResponse } from '../../../lib/error-utils';
import { deleteSessionImagesFromS3 } from '../../../lib/s3-storage';
import type { CleanupSessionResponse } from '../../../types/api';

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

async function parseRequest(request: Request): Promise<string> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw createApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  if (!body || typeof body !== 'object') {
    throw createApiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object.');
  }

  const sessionId = typeof (body as { sessionId?: unknown }).sessionId === 'string'
    ? (body as { sessionId: string }).sessionId.trim()
    : '';

  if (!sessionId) {
    throw createApiError(400, 'INVALID_REQUEST', 'sessionId is required.');
  }

  return sessionId;
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const sessionId = await parseRequest(request);
    const deleted = await deleteSessionImagesFromS3(sessionId);

    if (!deleted) {
      throw createApiError(404, 'SESSION_NOT_FOUND', 'No images were found for the provided sessionId.');
    }

    const response: CleanupSessionResponse = {
      sessionId,
      cleaned: true,
      status: 'deleted',
    };

    return json(response, 200);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return json(formatApiErrorResponse(error), error.status);
    }

    return json(
      formatApiErrorResponse(createApiError(500, 'PHOTO_CLEANUP_FAILED', 'Failed to clean up session photos.')),
      500,
    );
  }
}
