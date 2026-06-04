import { createStorageClient } from '../../../lib/storage';
import type { ApiErrorResponse, PhotoCleanupRequest, PhotoCleanupResponse } from '../../../types/api';

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

function parseRequestBody(body: unknown): PhotoCleanupRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const candidate = body as Record<string, unknown>;

  if (typeof candidate.sessionId !== 'string' || candidate.sessionId.trim().length === 0) {
    return null;
  }

  return {
    sessionId: candidate.sessionId.trim(),
  };
}

export async function DELETE(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const cleanupRequest = parseRequestBody(body);

  if (!cleanupRequest) {
    return errorResponse('sessionId is required', 400);
  }

  const storage = createStorageClient();

  try {
    const deleted = await storage.deleteAllForSession(cleanupRequest.sessionId);

    if (!deleted) {
      return errorResponse('Session images not found', 404);
    }

    return jsonResponse<PhotoCleanupResponse>({
      status: 'deleted',
    });
  } catch (error) {
    console.error('Failed to clean up session photos', error);
    return errorResponse('Failed to clean up session photos', 500);
  }
}
