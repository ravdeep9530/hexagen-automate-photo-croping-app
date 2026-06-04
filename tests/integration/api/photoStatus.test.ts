import { afterEach, describe, expect, it } from 'vitest';

import { GET } from '../../../src/app/api/photoStatus/route';
import type { PhotoStatusResponse } from '../../../src/types/api';

type TestSessionRecord = {
  sessionId: string;
  uploadedPhotoUrl: string | null;
  croppedPhotoUrl: string | null;
  complianceStatus?: PhotoStatusResponse['complianceStatus'];
};

type TestStore = {
  sessions: Map<string, TestSessionRecord>;
};

declare global {
  var __PHOTO_SESSION_STORE__: TestStore | undefined;
}

afterEach(() => {
  delete globalThis.__PHOTO_SESSION_STORE__;
});

describe('GET /api/photoStatus', () => {
  it('returns uploaded-only status when a session has an uploaded photo', async () => {
    globalThis.__PHOTO_SESSION_STORE__ = {
      sessions: new Map([
        [
          'session-uploaded',
          {
            sessionId: 'session-uploaded',
            uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
            croppedPhotoUrl: null,
            complianceStatus: 'uploaded',
          },
        ],
      ]),
    };

    const response = await GET(new Request('http://localhost/api/photoStatus?sessionId=session-uploaded'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: 'session-uploaded',
      hasUploaded: true,
      hasCropped: false,
      uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
      croppedPhotoUrl: null,
      complianceStatus: 'uploaded',
    });
  });

  it('returns uploaded-and-cropped status when both URLs exist', async () => {
    globalThis.__PHOTO_SESSION_STORE__ = {
      sessions: new Map([
        [
          'session-cropped',
          {
            sessionId: 'session-cropped',
            uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
            croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
            complianceStatus: 'cropped',
          },
        ],
      ]),
    };

    const response = await GET(new Request('http://localhost/api/photoStatus?sessionId=session-cropped'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: 'session-cropped',
      hasUploaded: true,
      hasCropped: true,
      uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
      croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
      complianceStatus: 'cropped',
    });
  });

  it('returns 404 when the session does not exist', async () => {
    globalThis.__PHOTO_SESSION_STORE__ = {
      sessions: new Map(),
    };

    const response = await GET(new Request('http://localhost/api/photoStatus?sessionId=missing-session'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: 'Session not found',
    });
  });

  it('returns 400 when sessionId is missing', async () => {
    const response = await GET(new Request('http://localhost/api/photoStatus'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'sessionId is required',
    });
  });
});
