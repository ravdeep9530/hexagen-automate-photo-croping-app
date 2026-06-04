import { getPhotoGuidelines } from '../../../lib/guidelines';
import type { ApiErrorResponse, PhotoGuidelinesResponse } from '../../../types/api';

type JsonResponse = Response & {
  json(): Promise<ApiErrorResponse | PhotoGuidelinesResponse>;
};

function jsonResponse(body: ApiErrorResponse | PhotoGuidelinesResponse, status = 200): JsonResponse {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  }) as JsonResponse;
}

export async function GET() {
  try {
    const guidelines = getPhotoGuidelines();
    return jsonResponse(guidelines);
  } catch {
    return jsonResponse({ message: 'Failed to load photo guidelines' }, 500);
  }
}
