import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const uploadMock = vi.fn();
const uuidMock = vi.fn();

vi.mock('../../../src/lib/storage', () => ({
  createStorageClient: () => ({
    upload: uploadMock,
  }),
}));

vi.mock('../../../src/lib/image-utils', () => ({
  MAX_UPLOAD_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  SUPPORTED_UPLOAD_MIME_TYPES: ['image/jpeg', 'image/png'],
  isSupportedUploadMimeType: (mimetype: string) => mimetype === 'image/jpeg' || mimetype === 'image/png',
  validateUploadImageSize: (size: number) => size > 0 && size <= 10 * 1024 * 1024,
}));

vi.mock('crypto', () => ({
  randomUUID: () => uuidMock(),
}));

function createMultipartRequest(file?: File) {
  const formData = new FormData();

  if (file) {
    formData.set('file', file);
  }

  return new Request('http://localhost/api/uploadPhoto', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/uploadPhoto', () => {
  beforeEach(() => {
    uuidMock.mockReset();
    uploadMock.mockReset();
    uuidMock.mockReturnValueOnce('session-123').mockReturnValueOnce('image-456');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('uploads a supported image and returns session metadata', async () => {
    uploadMock.mockResolvedValue({
      url: 'https://cdn.example.com/uploads/session-123/image-456.jpg',
    });

    const { POST } = await import('../../../src/app/api/uploadPhoto/route');
    const response = await POST(
      createMultipartRequest(new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' })),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: 'session-123',
      imageId: 'image-456',
      url: 'https://cdn.example.com/uploads/session-123/image-456.jpg',
    });
    expect(uploadMock).toHaveBeenCalledWith({
      body: Buffer.from([1, 2, 3]),
      contentType: 'image/jpeg',
      key: 'uploads/session-123/image-456.jpg',
    });
  });

  it('returns 415 for unsupported file types', async () => {
    const { POST } = await import('../../../src/app/api/uploadPhoto/route');
    const response = await POST(
      createMultipartRequest(new File([new Uint8Array([1])], 'photo.gif', { type: 'image/gif' })),
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      message: 'Unsupported file type. Allowed types: image/jpeg, image/png',
    });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('returns 413 for files above the maximum size', async () => {
    const { POST } = await import('../../../src/app/api/uploadPhoto/route');
    const largeFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'photo.png', { type: 'image/png' });
    const response = await POST(createMultipartRequest(largeFile));

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      message: 'File is too large. Maximum size is 10485760 bytes',
    });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the file field is missing', async () => {
    const { POST } = await import('../../../src/app/api/uploadPhoto/route');
    const response = await POST(createMultipartRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Image file is required',
    });
  });

  it('returns 400 when the file is empty or invalid', async () => {
    const { POST } = await import('../../../src/app/api/uploadPhoto/route');
    const response = await POST(createMultipartRequest(new File([], 'photo.jpg', { type: 'image/jpeg' })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Invalid image file',
    });
  });

  it('returns 500 when storage upload fails', async () => {
    uploadMock.mockRejectedValue(new Error('S3 unavailable'));

    const { POST } = await import('../../../src/app/api/uploadPhoto/route');
    const response = await POST(
      createMultipartRequest(new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' })),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Failed to upload photo',
    });
  });
});
