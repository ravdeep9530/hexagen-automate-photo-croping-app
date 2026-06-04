import { beforeEach, describe, expect, it, vi } from 'vitest';

const getObjectFromS3Mock = vi.fn();
const getImageMetadataMock = vi.fn();
const validateCropBoundsMock = vi.fn();
const cropImageMock = vi.fn();
const uploadToStorageMock = vi.fn();

vi.mock('../../../../lib/s3-storage', () => ({
  getObjectFromS3: getObjectFromS3Mock,
}));

vi.mock('../../../../lib/image-utils', () => ({
  getImageMetadata: getImageMetadataMock,
  validateCropBounds: validateCropBoundsMock,
  cropImage: cropImageMock,
  uploadToStorage: uploadToStorageMock,
}));

describe('POST /api/saveCroppedPhoto', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getObjectFromS3Mock.mockReset();
    getImageMetadataMock.mockReset();
    validateCropBoundsMock.mockReset();
    cropImageMock.mockReset();
    uploadToStorageMock.mockReset();
  });

  it('returns cropped image details on success', async () => {
    const sourceBuffer = Buffer.from('source-image');
    const croppedBuffer = Buffer.from('cropped-image');
    getObjectFromS3Mock.mockResolvedValue(sourceBuffer);
    getImageMetadataMock.mockResolvedValue({ width: 400, height: 600, format: 'jpeg' });
    validateCropBoundsMock.mockReturnValue({ width: 200, height: 200, left: 0, top: 0 });
    cropImageMock.mockResolvedValue(croppedBuffer);
    uploadToStorageMock.mockResolvedValue('https://cdn.example.com/cropped/id.jpg');

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'session/image.jpg', x: 0, y: 0, width: 200, height: 200, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      croppedImageId: expect.any(String),
      url: 'https://cdn.example.com/cropped/id.jpg',
      complianceStatus: 'pending',
    });
    expect(getObjectFromS3Mock).toHaveBeenCalledWith('session/image.jpg');
    expect(uploadToStorageMock).toHaveBeenCalledWith(croppedBuffer, expect.stringMatching(/^cropped\/.+\.jpg$/));
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ x: 0, y: 0, width: 100, height: 100, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INVALID_REQUEST', message: 'imageId is required.' },
    });
  });

  it('returns 400 for invalid numeric values', async () => {
    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'img.jpg', x: 'a', y: 0, width: 100, height: 100, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INVALID_REQUEST', message: 'x must be a finite number.' },
    });
  });

  it('returns 422 for out-of-bounds crop', async () => {
    getObjectFromS3Mock.mockResolvedValue(Buffer.from('source-image'));
    getImageMetadataMock.mockResolvedValue({ width: 100, height: 100, format: 'jpeg' });
    validateCropBoundsMock.mockImplementation(() => {
      throw new Error('Crop area exceeds the image bounds.');
    });

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'img.jpg', x: 10, y: 10, width: 100, height: 100, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INVALID_CROP', message: 'Crop area exceeds the image bounds.' },
    });
  });

  it('returns 422 for aspect ratio mismatch', async () => {
    getObjectFromS3Mock.mockResolvedValue(Buffer.from('source-image'));
    getImageMetadataMock.mockResolvedValue({ width: 100, height: 100, format: 'jpeg' });
    validateCropBoundsMock.mockImplementation(() => {
      throw new Error('Crop aspect ratio does not match the requested aspect ratio.');
    });

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'img.jpg', x: 0, y: 0, width: 80, height: 100, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INVALID_CROP', message: 'Crop aspect ratio does not match the requested aspect ratio.' },
    });
  });

  it('returns 404 when source image does not exist', async () => {
    getObjectFromS3Mock.mockResolvedValue(null);

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'missing.jpg', x: 0, y: 0, width: 100, height: 100, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'SOURCE_IMAGE_NOT_FOUND', message: 'Source image could not be found.' },
    });
  });

  it('returns 500 when sharp cropping fails', async () => {
    getObjectFromS3Mock.mockResolvedValue(Buffer.from('source-image'));
    getImageMetadataMock.mockResolvedValue({ width: 400, height: 400, format: 'jpeg' });
    validateCropBoundsMock.mockReturnValue({ width: 100, height: 100, left: 0, top: 0 });
    cropImageMock.mockRejectedValue(new Error('sharp failed'));

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'img.jpg', x: 0, y: 0, width: 100, height: 100, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'IMAGE_PROCESSING_FAILED', message: 'Failed to crop image.' },
    });
  });

  it('returns 500 when s3 upload fails', async () => {
    getObjectFromS3Mock.mockResolvedValue(Buffer.from('source-image'));
    getImageMetadataMock.mockResolvedValue({ width: 400, height: 400, format: 'jpeg' });
    validateCropBoundsMock.mockReturnValue({ width: 100, height: 100, left: 0, top: 0 });
    cropImageMock.mockResolvedValue(Buffer.from('cropped-image'));
    uploadToStorageMock.mockRejectedValue(new Error('upload failed'));

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'img.jpg', x: 0, y: 0, width: 100, height: 100, aspectRatio: 1 }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'STORAGE_UPLOAD_FAILED', message: 'Failed to store cropped image.' },
    });
  });
});
