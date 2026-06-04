import { describe, expect, it } from 'vitest';

import type {
  CleanupSessionResponse,
  CropGuidelinesResponse,
  SaveCropRequest,
  SessionStatusResponse,
  UploadImageResponse,
} from '../api';
import type { CropParameters } from '../crop-parameters';
import type { CroppedImage } from '../cropped-image';
import type { UserPhotoSession } from '../session';
import type { UploadedImage } from '../uploaded-image';

describe('type contracts compile', () => {
  it('supports the core model types', () => {
    const session: UserPhotoSession = {
      sessionId: 'session-1',
      userId: null,
      uploadedPhotoUrl: 'https://example.com/raw.jpg',
    };

    const uploadedImage: UploadedImage = {
      imageId: 'image-1',
      sessionId: session.sessionId,
      filename: 'photo.jpg',
      mimetype: 'image/jpeg',
      sizeBytes: 1024,
      width: 600,
      height: 800,
      storageUrl: 'https://example.com/photo.jpg',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const crop: CropParameters = {
      imageId: uploadedImage.imageId,
      x: 10,
      y: 20,
      width: 300,
      height: 400,
      aspectRatio: 0.75,
      rotation: 0,
      scale: 1,
    };

    const croppedImage: CroppedImage = {
      croppedImageId: 'crop-1',
      imageId: uploadedImage.imageId,
      sessionId: session.sessionId,
      storageUrl: 'https://example.com/cropped.jpg',
      width: 300,
      height: 400,
      format: 'jpeg',
      fileSizeBytes: 512,
      createdAt: '2024-01-01T00:01:00.000Z',
    };

    const uploadResponse: UploadImageResponse = {
      session,
      uploadedImage,
      success: true,
    };

    const statusResponse: SessionStatusResponse = {
      session,
      uploadedImage,
      croppedImage,
      status: 'cropped',
    };

    const saveCropRequest: SaveCropRequest = {
      sessionId: session.sessionId,
      crop,
    };

    const guidelines: CropGuidelinesResponse = {
      aspectRatio: 0.75,
      minWidth: 300,
      minHeight: 400,
      acceptedMimeTypes: ['image/jpeg', 'image/png'],
      maxFileSizeBytes: 5_000_000,
    };

    const cleanupResponse: CleanupSessionResponse = {
      sessionId: session.sessionId,
      cleaned: true,
    };

    expect(uploadResponse.success).toBe(true);
    expect(statusResponse.status).toBe('cropped');
    expect(saveCropRequest.crop.width).toBe(300);
    expect(guidelines.acceptedMimeTypes).toContain('image/jpeg');
    expect(cleanupResponse.cleaned).toBe(true);
  });
});
