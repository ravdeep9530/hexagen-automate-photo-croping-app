import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = sendMock;
  }

  class PutObjectCommand {
    constructor(public input: unknown) {}
  }

  class GetObjectCommand {
    constructor(public input: unknown) {}
  }

  class ListObjectsV2Command {
    constructor(public input: unknown) {}
  }

  class DeleteObjectCommand {
    constructor(public input: unknown) {}
  }

  return {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
  };
});

describe('storage deleteAllForSession', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    delete process.env.AWS_S3_ENDPOINT;
    delete process.env.AWS_S3_PUBLIC_URL;
  });

  it('returns false when no uploaded objects exist for the session', async () => {
    sendMock.mockResolvedValueOnce({ Contents: [] });

    const { createStorageClient } = await import('../../../src/lib/storage');
    const storage = createStorageClient();

    await expect(storage.deleteAllForSession('session-123')).resolves.toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].input).toEqual({
      Bucket: 'test-bucket',
      Prefix: 'uploads/session-123/',
    });
  });

  it('deletes uploaded objects and checks cropped prefixes for the session', async () => {
    sendMock
      .mockResolvedValueOnce({
        Contents: [{ Key: 'uploads/session-123/image-1.jpg' }, { Key: 'uploads/session-123/image-2.png' }],
      })
      .mockResolvedValue({});

    const { createStorageClient } = await import('../../../src/lib/storage');
    const storage = createStorageClient();

    await expect(storage.deleteAllForSession('session-123')).resolves.toBe(true);

    expect(sendMock.mock.calls.map((call: [{ input: unknown }]) => call[0].input)).toEqual([
      { Bucket: 'test-bucket', Prefix: 'uploads/session-123/' },
      { Bucket: 'test-bucket', Key: 'uploads/session-123/image-1.jpg' },
      { Bucket: 'test-bucket', Key: 'uploads/session-123/image-2.png' },
      { Bucket: 'test-bucket', Prefix: 'cropped/uploads/session-123/image-1.jpg/' },
      { Bucket: 'test-bucket', Prefix: 'cropped/uploads/session-123/image-2.png/' },
    ]);
  });
});
