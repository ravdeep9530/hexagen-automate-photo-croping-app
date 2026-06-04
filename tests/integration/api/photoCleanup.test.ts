import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const deleteAllForSessionMock = vi.fn();

vi.mock('../../../src/lib/storage', () => ({
  createStorageClient: () => ({
    deleteAllForSession: deleteAllForSessionMock,
  }),
}));

describe('DELETE /api/photoCleanup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    deleteAllForSessionMock.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('deletes all images for the session and returns a status string', async () => {
    const { DELETE } = await import('../../../src/app/api/photoCleanup/route');
    const response = await DELETE(
      new Request('http://localhost/api/photoCleanup', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-123' }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'deleted',
    });
    expect(deleteAllForSessionMock).toHaveBeenCalledWith('session-123');
  });

  it('returns 404 when the session images are not found', async () => {
    deleteAllForSessionMock.mockResolvedValue(false);

    const { DELETE } = await import('../../../src/app/api/photoCleanup/route');
    const response = await DELETE(
      new Request('http://localhost/api/photoCleanup', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'missing-session' }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: 'Session images not found',
    });
  });

  it('returns 400 when sessionId is missing', async () => {
    const { DELETE } = await import('../../../src/app/api/photoCleanup/route');
    const response = await DELETE(
      new Request('http://localhost/api/photoCleanup', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'sessionId is required',
    });
    expect(deleteAllForSessionMock).not.toHaveBeenCalled();
  });

  it('returns 500 when storage deletion fails', async () => {
    deleteAllForSessionMock.mockRejectedValue(new Error('S3 unavailable'));

    const { DELETE } = await import('../../../src/app/api/photoCleanup/route');
    const response = await DELETE(
      new Request('http://localhost/api/photoCleanup', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-123' }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Failed to clean up session photos',
    });
  });
});
