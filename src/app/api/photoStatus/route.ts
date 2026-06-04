import type { ApiErrorResponse, PhotoStatusResponse } from '../../../types/api';

type SessionRecord = {
  sessionId: string;
  uploadedPhotoUrl: string | null;
  croppedPhotoUrl: string | null;
  complianceStatus?: PhotoStatusResponse['complianceStatus'];
};

type SessionStore = {
  getSession?: (sessionId: string) => SessionRecord | null | undefined | Promise<SessionRecord | null | undefined>;
  get?: (sessionId: string) => SessionRecord | null | undefined | Promise<SessionRecord | null | undefined>;
  sessions?: Map<string, SessionRecord>;
};

type JsonResponse = Response & {
  json(): Promise<ApiErrorResponse | PhotoStatusResponse>;
};

function jsonResponse(body: ApiErrorResponse | PhotoStatusResponse, status = 200): JsonResponse {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  }) as JsonResponse;
}

function resolveStore(): SessionStore | null {
  const globalStore = globalThis as typeof globalThis & {
    __PHOTO_SESSION_STORE__?: SessionStore;
  };

  return globalStore.__PHOTO_SESSION_STORE__ ?? null;
}

async function loadSession(sessionId: string): Promise<SessionRecord | null> {
  const store = resolveStore();

  if (!store) {
    return null;
  }

  if (typeof store.getSession === 'function') {
    return (await store.getSession(sessionId)) ?? null;
  }

  if (typeof store.get === 'function') {
    return (await store.get(sessionId)) ?? null;
  }

  if (store.sessions instanceof Map) {
    return store.sessions.get(sessionId) ?? null;
  }

  return null;
}

function badRequest(message: string) {
  return jsonResponse({ message }, 400);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId')?.trim();

  if (!sessionId) {
    return badRequest('sessionId is required');
  }

  const session = await loadSession(sessionId);

  if (!session) {
    return jsonResponse({ message: 'Session not found' }, 404);
  }

  const hasUploaded = Boolean(session.uploadedPhotoUrl);
  const hasCropped = Boolean(session.croppedPhotoUrl);
  const complianceStatus = session.complianceStatus ?? (hasCropped ? 'cropped' : hasUploaded ? 'uploaded' : 'missing_upload');

  return jsonResponse({
    sessionId: session.sessionId,
    hasUploaded,
    hasCropped,
    uploadedPhotoUrl: session.uploadedPhotoUrl,
    croppedPhotoUrl: session.croppedPhotoUrl,
    complianceStatus,
  });
}
