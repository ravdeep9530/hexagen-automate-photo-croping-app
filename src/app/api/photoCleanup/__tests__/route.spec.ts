import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteSessionImagesFromS3Mock = vi.fn();

vi.mock('../../../../lib/s3-storage', () => ({
  deleteSessionImagesFromS3: deleteSessionImagesFromS3Mock,
}));

describe('DELETE /api/photoCleanup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    deleteSessionImagesFromS3Mock.mockReset();
  });

  it('deletes all images for a session and returns a status string', async () => {
    deleteSessionImagesFromS3Mock.mockResolvedValue(true);

    const { DELETE } = await import('../route');
    const response = await DELETE(
      new Request('http://localhost/api/photoCleanup', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-123' }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: 'session-123',
      cleaned: true,
      status: 'deleted',
    });
    expect(deleteSessionImagesFromS3Mock).toHaveBeenCalledWith('session-123');
  });

  it('returns 404 when no images exist for the session', async () => {
    deleteSessionImagesFromS3Mock.mockResolvedValue(false);

    const { DELETE } = await import('../route');
    const response = await DELETE(
      new Request('http://localhost/api/photoCleanup', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'missing-session' }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'No images were found for the provided sessionId.',
      },
    });
  });

  it('returns 500 when storage cleanup fails', async () => {
    deleteSessionImagesFromS3Mock.mockRejectedValue(new Error('storage unavailable'));

    const { DELETE } = await import('../route');
    const response = await DELETE(
      new Request('http://localhost/api/photoCleanup', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-123' }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'PHOTO_CLEANUP_FAILED',
        message: 'Failed to clean up session photos.',
      },
    });
  });
});
