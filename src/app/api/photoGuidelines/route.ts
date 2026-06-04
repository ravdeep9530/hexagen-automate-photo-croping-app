import type { ApiError, PhotoGuidelinesResponse } from '../../../types/api';
import { getPhotoGuidelines } from '../../../lib/photo-guidelines';

interface JsonResponse {
  status: number;
  body: PhotoGuidelinesResponse | { error: string } | { error: ApiError };
}

function json(body: JsonResponse['body'], status = 200): JsonResponse {
  return { status, body };
}

function createInternalServerError(): ApiError {
  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    details: null,
  };
}

export async function GET(): Promise<JsonResponse> {
  const { requirements, visuals } = getPhotoGuidelines();

  return json({ requirements, visuals });
}

export async function handleGetPhotoGuidelines(): Promise<JsonResponse> {
  try {
    return await GET();
  } catch {
    return json({ error: createInternalServerError() }, 500);
  }
}
