import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getObjectMock = vi.fn();
const uploadMock = vi.fn();
const cropImageMock = vi.fn();
const getImageDimensionsMock = vi.fn();
const validateCropParametersMock = vi.fn();
const uuidMock = vi.fn();

vi.mock('../../../src/lib/storage', () => ({
  createStorageClient: () => ({
    getObject: getObjectMock,
    upload: uploadMock,
  }),
}));

vi.mock('../../../src/lib/image-utils', () => ({
  cropImage: cropImageMock,
  getImageDimensions: getImageDimensionsMock,
  validateCropParameters: validateCropParametersMock,
}));

vi.mock('crypto', () => ({
  randomUUID: () => uuidMock(),
}));

describe('POST /api/saveCroppedPhoto', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    uuidMock.mockReturnValue('cropped-image-123');
    getObjectMock.mockResolvedValue({
      body: Buffer.from('source-image'),
      contentType: 'image/jpeg',
    });
    getImageDimensionsMock.mockResolvedValue({ width: 1200, height: 1600 });
    validateCropParametersMock.mockReturnValue({ valid: true });
    cropImageMock.mockResolvedValue(Buffer.from('cropped-image'));
    uploadMock.mockResolvedValue({ url: 'https://cdn.example.com/cropped.jpg' });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('crops the source image, stores it, and returns crop metadata', async () => {
    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const request = new Request('http://localhost/api/saveCroppedPhoto', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageId: 'image-1.jpg',
        x: 10,
        y: 20,
        width: 400,
        height: 500,
        aspectRatio: 0.8,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      croppedImageId: 'cropped-image-123',
      url: 'https://cdn.example.com/cropped.jpg',
      complianceStatus: 'cropped',
    });
    expect(getObjectMock).toHaveBeenCalledWith('uploads/image-1.jpg');
    expect(getImageDimensionsMock).toHaveBeenCalledWith(Buffer.from('source-image'));
    expect(validateCropParametersMock).toHaveBeenCalledWith(
      {
        imageId: 'image-1.jpg',
        x: 10,
        y: 20,
        width: 400,
        height: 500,
        aspectRatio: 0.8,
      },
      { width: 1200, height: 1600 },
    );
    expect(cropImageMock).toHaveBeenCalledWith(
      {
        imageId: 'image-1.jpg',
        x: 10,
        y: 20,
        width: 400,
        height: 500,
        aspectRatio: 0.8,
      },
      Buffer.from('source-image'),
    );
    expect(uploadMock).toHaveBeenCalledWith({
      body: Buffer.from('cropped-image'),
      contentType: 'image/jpeg',
      key: 'cropped/image-1.jpg/cropped-image-123.jpg',
    });
  });

  it('returns 400 for missing required fields', async () => {
    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId: 'image-1.jpg', x: 10 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'imageId, x, y, width, height, and aspectRatio are required and must be valid types',
    });
  });

  it('returns 400 for invalid numeric field types', async () => {
    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: 'image-1.jpg',
          x: '10',
          y: 20,
          width: 400,
          height: 500,
          aspectRatio: 0.8,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'imageId, x, y, width, height, and aspectRatio are required and must be valid types',
    });
  });

  it('returns 400 for invalid crop bounds', async () => {
    validateCropParametersMock.mockReturnValue({ valid: false, message: 'Crop area exceeds image bounds' });

    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: 'image-1.jpg',
          x: 1000,
          y: 20,
          width: 400,
          height: 500,
          aspectRatio: 0.8,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Crop area exceeds image bounds',
    });
  });

  it('returns 400 for aspect ratio mismatch', async () => {
    validateCropParametersMock.mockReturnValue({
      valid: false,
      message: 'Crop aspect ratio does not match the requested aspect ratio',
    });

    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: 'image-1.jpg',
          x: 10,
          y: 20,
          width: 500,
          height: 500,
          aspectRatio: 0.8,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Crop aspect ratio does not match the requested aspect ratio',
    });
  });

  it('returns 404 when the source image does not exist', async () => {
    getObjectMock.mockResolvedValue(null);

    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: 'missing-image.jpg',
          x: 10,
          y: 20,
          width: 400,
          height: 500,
          aspectRatio: 0.8,
        }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: 'Source image not found',
    });
  });

  it('returns 500 when image processing fails', async () => {
    cropImageMock.mockRejectedValue(new Error('Sharp failed'));

    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: 'image-1.jpg',
          x: 10,
          y: 20,
          width: 400,
          height: 500,
          aspectRatio: 0.8,
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Failed to save cropped photo',
    });
  });

  it('returns 500 when storage upload fails', async () => {
    uploadMock.mockRejectedValue(new Error('S3 unavailable'));

    const { POST } = await import('../../../src/app/api/saveCroppedPhoto/route');
    const response = await POST(
      new Request('http://localhost/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: 'image-1.jpg',
          x: 10,
          y: 20,
          width: 400,
          height: 500,
          aspectRatio: 0.8,
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Failed to save cropped photo',
    });
  });
});
