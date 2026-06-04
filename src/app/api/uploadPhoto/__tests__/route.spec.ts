import { beforeEach, describe, expect, it, vi } from 'vitest';

const validateImageUploadMock = vi.fn();
const uploadToS3Mock = vi.fn();

vi.mock('../../../lib/image-utils', () => ({
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png'],
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  validateImageUpload: validateImageUploadMock,
}));

vi.mock('../../../lib/s3-storage', () => ({
  uploadToS3: uploadToS3Mock,
}));

describe('POST /api/uploadPhoto', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function importRoute() {
    vi.doMock('sharp', () => ({
      default: vi.fn(() => ({ metadata: vi.fn() })),
    }));

    return import('../route');
  }

  async function createMultipartRequest({
    sessionId,
    file,
    contentType,
  }: {
    sessionId?: string;
    file?: File;
    contentType?: string;
  }) {
    if (contentType) {
      return new Request('http://localhost/api/uploadPhoto', {
        method: 'POST',
        headers: { 'content-type': contentType },
        body: 'plain-text',
      });
    }

    const formData = new FormData();
    if (sessionId !== undefined) {
      formData.set('sessionId', sessionId);
    }
    if (file) {
      formData.set('file', file);
    }

    return new Request('http://localhost/api/uploadPhoto', {
      method: 'POST',
      body: formData,
    });
  }

  it('uploads a valid image and returns sessionId, imageId, and url', async () => {
    validateImageUploadMock.mockResolvedValue({ ok: true, width: 100, height: 100 });
    uploadToS3Mock.mockResolvedValue('https://cdn.example.com/session/image.jpg');

    const { POST } = await importRoute();
    const file = new File([Uint8Array.from([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
    const response = await POST(await createMultipartRequest({ sessionId: 'session-123', file }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessionId).toBe('session-123');
    expect(body.imageId).toEqual(expect.any(String));
    expect(body.url).toBe('https://cdn.example.com/session/image.jpg');
    expect(validateImageUploadMock).toHaveBeenCalledWith(Buffer.from([1, 2, 3]), 'image/jpeg');
    expect(uploadToS3Mock).toHaveBeenCalledWith({
      buffer: Buffer.from([1, 2, 3]),
      key: expect.stringMatching(/^session-123\/.+\.jpg$/),
      contentType: 'image/jpeg',
    });
  });

  it('returns 415 for unsupported file types', async () => {
    validateImageUploadMock.mockResolvedValue({ ok: false, reason: 'unsupported_type' });

    const { POST } = await importRoute();
    const file = new File([Uint8Array.from([1, 2, 3])], 'photo.gif', { type: 'image/gif' });
    const response = await POST(await createMultipartRequest({ sessionId: 'session-123', file }));
    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body).toEqual({
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Only image/jpeg and image/png files are supported.',
      },
    });
  });

  it('returns 413 when the file is too large', async () => {
    validateImageUploadMock.mockResolvedValue({ ok: false, reason: 'too_large' });

    const { POST } = await importRoute();
    const file = new File([Uint8Array.from([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
    const response = await POST(await createMultipartRequest({ sessionId: 'session-123', file }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Image must be 10485760 bytes or smaller.',
      },
    });
  });

  it('returns 400 when sessionId is missing', async () => {
    const { POST } = await importRoute();
    const file = new File([Uint8Array.from([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
    const response = await POST(await createMultipartRequest({ file }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'INVALID_FORM_DATA',
        message: 'sessionId is required.',
      },
    });
  });

  it('returns 400 when no file is provided', async () => {
    const { POST } = await importRoute();
    const response = await POST(await createMultipartRequest({ sessionId: 'session-123' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'INVALID_FORM_DATA',
        message: 'An image file is required.',
      },
    });
  });

  it('returns 400 when request is not multipart form data', async () => {
    const { POST } = await importRoute();
    const response = await POST(
      await createMultipartRequest({
        contentType: 'application/json',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'INVALID_FORM_DATA',
        message: 'Request must use multipart/form-data.',
      },
    });
  });

  it('returns 500 when S3 storage upload fails', async () => {
    validateImageUploadMock.mockResolvedValue({ ok: true, width: 100, height: 100 });
    uploadToS3Mock.mockRejectedValue(new Error('s3 unavailable'));

    const { POST } = await importRoute();
    const file = new File([Uint8Array.from([1, 2, 3])], 'photo.png', { type: 'image/png' });
    const response = await POST(await createMultipartRequest({ sessionId: 'session-123', file }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload image. Please try again.',
      },
    });
  });
});
