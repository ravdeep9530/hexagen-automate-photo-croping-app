import { afterEach, describe, expect, it } from 'vitest';

import { __setPhotoSessionsForTests, handleGetPhotoStatus } from '../route';

describe('GET /api/photoStatus', () => {
  afterEach(() => {
    __setPhotoSessionsForTests(undefined);
  });

  it('returns 400 when sessionId is missing', async () => {
    const response = await handleGetPhotoStatus(new Request('http://localhost/api/photoStatus'));

    expect(response).toEqual({
      status: 400,
      body: { error: 'sessionId is required' },
    });
  });

  it('returns 404 when the session is unknown', async () => {
    __setPhotoSessionsForTests(new Map());

    const response = await handleGetPhotoStatus(
      new Request('http://localhost/api/photoStatus?sessionId=missing-session'),
    );

    expect(response).toEqual({
      status: 404,
      body: { error: 'Photo session not found' },
    });
  });

  it('returns uploaded-only status', async () => {
    __setPhotoSessionsForTests(
      new Map([
        [
          'session-uploaded',
          {
            sessionId: 'session-uploaded',
            uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
          },
        ],
      ]),
    );

    const response = await handleGetPhotoStatus(
      new Request('http://localhost/api/photoStatus?sessionId=session-uploaded'),
    );

    expect(response).toEqual({
      status: 200,
      body: {
        sessionId: 'session-uploaded',
        hasUploaded: true,
        hasCropped: false,
        uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
        croppedPhotoUrl: null,
        complianceStatus: null,
      },
    });
  });

  it('returns cropped status', async () => {
    __setPhotoSessionsForTests(
      new Map([
        [
          'session-cropped',
          {
            sessionId: 'session-cropped',
            uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
            croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
            complianceStatus: 'approved',
          },
        ],
      ]),
    );

    const response = await handleGetPhotoStatus(
      new Request('http://localhost/api/photoStatus?sessionId=session-cropped'),
    );

    expect(response).toEqual({
      status: 200,
      body: {
        sessionId: 'session-cropped',
        hasUploaded: true,
        hasCropped: true,
        uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
        croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
        complianceStatus: 'approved',
      },
    });
  });
});
