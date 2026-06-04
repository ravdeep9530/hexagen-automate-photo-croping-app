import { describe, expect, it } from 'vitest';

import { mapPhotoSessionToStatus } from '../photo-status';

describe('mapPhotoSessionToStatus', () => {
  it('maps an uploaded-only session', () => {
    expect(
      mapPhotoSessionToStatus({
        sessionId: 'session-1',
        uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
      }),
    ).toEqual({
      hasUploaded: true,
      hasCropped: false,
      uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
      croppedPhotoUrl: null,
      complianceStatus: null,
    });
  });

  it('maps a cropped session with compliance status', () => {
    expect(
      mapPhotoSessionToStatus({
        sessionId: 'session-2',
        uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
        croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
        complianceStatus: 'approved',
      }),
    ).toEqual({
      hasUploaded: true,
      hasCropped: true,
      uploadedPhotoUrl: 'https://cdn.example.com/uploaded.jpg',
      croppedPhotoUrl: 'https://cdn.example.com/cropped.jpg',
      complianceStatus: 'approved',
    });
  });

  it('normalizes blank values to null', () => {
    expect(
      mapPhotoSessionToStatus({
        sessionId: 'session-3',
        uploadedPhotoUrl: '   ',
        croppedPhotoUrl: '',
        complianceStatus: ' ',
      }),
    ).toEqual({
      hasUploaded: false,
      hasCropped: false,
      uploadedPhotoUrl: null,
      croppedPhotoUrl: null,
      complianceStatus: null,
    });
  });
});
