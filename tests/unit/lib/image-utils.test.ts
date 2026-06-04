import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();
const sharpPipeline = {
  extract: vi.fn().mockReturnThis(),
  toBuffer: vi.fn(),
};
const sharpMock = vi.fn(() => sharpPipeline);
const putObjectCommandMock = vi.fn(function putObjectCommand(this: unknown, input: unknown) {
  return { input };
});
const s3ClientMock = vi.fn(function S3Client(this: unknown) {
  return { send: sendMock };
});

vi.mock('sharp', () => ({
  default: sharpMock,
}));

vi.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: putObjectCommandMock,
  S3Client: s3ClientMock,
}));

describe('image-utils', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    sharpPipeline.extract.mockReturnThis();
    sharpPipeline.toBuffer.mockResolvedValue(Buffer.from('cropped-image'));
    sendMock.mockResolvedValue({});

    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'photo-bucket';
    process.env.AWS_ACCESS_KEY_ID = 'access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret-key';
    delete process.env.AWS_S3_ENDPOINT;
    delete process.env.AWS_S3_PUBLIC_URL;
  });

  it('validates supported image types within the size limit', async () => {
    const { validateImage } = await import('../../../src/lib/image-utils');

    await expect(validateImage(Buffer.alloc(1024), 'image/jpeg')).resolves.toBe(true);
    await expect(validateImage(Buffer.alloc(1024), 'image/gif')).resolves.toBe(false);
    await expect(validateImage(Buffer.alloc(11 * 1024 * 1024), 'image/png')).resolves.toBe(false);
  });

  it('crops an image buffer with rounded extract coordinates', async () => {
    const { cropImage } = await import('../../../src/lib/image-utils');

    const result = await cropImage(
      {
        imageId: 'image-1',
        x: 10.4,
        y: 20.6,
        width: 199.5,
        height: 100.2,
        aspectRatio: 2,
      },
      Buffer.from('original-image'),
    );

    expect(sharpMock).toHaveBeenCalledWith(Buffer.from('original-image'));
    expect(sharpPipeline.extract).toHaveBeenCalledWith({ left: 10, top: 21, width: 200, height: 100 });
    expect(result).toEqual(Buffer.from('cropped-image'));
  });

  it('uploads to S3 and returns the default AWS object URL', async () => {
    const { uploadToStorage } = await import('../../../src/lib/image-utils');

    const buffer = Buffer.from('image-data');
    const result = await uploadToStorage(buffer, 'uploads/photo.jpg');

    expect(s3ClientMock).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
      },
      forcePathStyle: false,
    });
    expect(putObjectCommandMock).toHaveBeenCalledWith({
      Bucket: 'photo-bucket',
      Key: 'uploads/photo.jpg',
      Body: buffer,
      ACL: 'public-read',
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(result).toBe('https://photo-bucket.s3.us-east-1.amazonaws.com/uploads/photo.jpg');
  });

  it('uses configured public URLs and custom endpoints when provided', async () => {
    process.env.AWS_S3_ENDPOINT = 'https://storage.example.com';
    process.env.AWS_S3_PUBLIC_URL = 'https://cdn.example.com/assets';

    const { uploadToStorage } = await import('../../../src/lib/image-utils');

    const result = await uploadToStorage(Buffer.from('image-data'), 'crop.png');

    expect(s3ClientMock).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
      },
      endpoint: 'https://storage.example.com',
      forcePathStyle: true,
    });
    expect(result).toBe('https://cdn.example.com/assets/crop.png');
  });

  it('throws when required storage configuration is missing', async () => {
    delete process.env.AWS_REGION;

    const { uploadToStorage } = await import('../../../src/lib/image-utils');

    await expect(uploadToStorage(Buffer.from('image-data'), 'crop.png')).rejects.toThrow(
      'Missing required environment variable: AWS_REGION',
    );
  });
});
