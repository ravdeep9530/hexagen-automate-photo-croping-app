import { mapPhotoSessionToStatus, type StoredPhotoSession } from '../../../lib/photo-status';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface JsonResponse {
  status: number;
  body: unknown;
}

type SessionStore = Map<string, StoredPhotoSession>;

type GlobalWithPhotoStore = typeof globalThis & {
  __photoSessions__?: SessionStore;
};

function getSessionStore(): SessionStore {
  const scopedGlobal = globalThis as GlobalWithPhotoStore;
  if (!scopedGlobal.__photoSessions__) {
    scopedGlobal.__photoSessions__ = new Map<string, StoredPhotoSession>();
  }

  return scopedGlobal.__photoSessions__;
}

function json(body: unknown, status = 200): JsonResponse {
  return { status, body };
}

export async function GET(request: Request): Promise<JsonResponse> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId')?.trim();

  if (!sessionId) {
    throw new HttpError(400, 'sessionId is required');
  }

  const session = getSessionStore().get(sessionId);
  if (!session) {
    return json({ error: 'Photo session not found' }, 404);
  }

  return json({ sessionId, ...mapPhotoSessionToStatus(session) });
}

export async function handleGetPhotoStatus(request: Request): Promise<JsonResponse> {
  try {
    return await GET(request);
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    return json({ error: 'Internal server error' }, 500);
  }
}

export function __setPhotoSessionsForTests(store: SessionStore | undefined): void {
  const scopedGlobal = globalThis as GlobalWithPhotoStore;
  scopedGlobal.__photoSessions__ = store;
}
