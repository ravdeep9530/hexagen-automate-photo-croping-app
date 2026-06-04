import { beforeEach, describe, expect, it, vi } from 'vitest';

const metadataMock = vi.fn();
const extractMock = vi.fn();
const toBufferMock = vi.fn();
const sharpMock = vi.fn((input: Buffer) => ({
  metadata: metadataMock,
  extract: extractMock.mockImplementation(({ left, top, width, height }) => ({
    toBuffer: toBufferMock.mockImplementation(() =>
      Promise.resolve(Buffer.from(`${input.toString('hex')}:${left},${top},${width},${height}`)),
    ),
  })),
}));

const sendMock = vi.fn();
const S3ClientMock = vi.fn(function S3Client(this: { send: typeof sendMock }) {
  this.send = sendMock;
});
const PutObjectCommandMock = vi.fn(function PutObjectCommand(this: { input: unknown }, input) {
  this.input = input;
});

vi.mock('sharp', () => ({
  default: sharpMock,
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: S3ClientMock,
  PutObjectCommand: PutObjectCommandMock,
}));

describe('image-utils', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    metadataMock.mockReset();
    extractMock.mockReset();
    toBufferMock.mockReset();
    sendMock.mockReset();
    S3ClientMock.mockClear();
    PutObjectCommandMock.mockClear();
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_BUCKET;
    delete process.env.S3_REGION;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_PUBLIC_URL;
  });

  it('validateImage returns true for allowed mime type with matching metadata', async () => {
    metadataMock.mockResolvedValue({ format: 'jpeg', width: 600, height: 600 });
    const { validateImage } = await import('../image-utils');

    await expect(validateImage(Buffer.from('image-data'), 'image/jpeg')).resolves.toBe(true);
    expect(sharpMock).toHaveBeenCalled();
  });

  it('validateImage returns false when mime type is not allowed or metadata mismatches', async () => {
    metadataMock.mockResolvedValue({ format: 'png', width: 400, height: 400 });
    const { validateImage } = await import('../image-utils');

    await expect(validateImage(Buffer.from('image-data'), 'image/gif')).resolves.toBe(false);
    await expect(validateImage(Buffer.from('image-data'), 'image/jpeg')).resolves.toBe(false);
  });

  it('cropImage extracts the requested region', async () => {
    const { cropImage } = await import('../image-utils');
    const file = Buffer.from('crop-me');

    const result = await cropImage(
      {
        imageId: 'img-1',
        x: 12.4,
        y: 9.6,
        width: 120.2,
        height: 180.8,
        aspectRatio: 1,
        rotation: 0,
        scale: 1,
      },
      file,
    );

    expect(extractMock).toHaveBeenCalledWith({ left: 12, top: 10, width: 120, height: 181 });
    expect(result).toBeInstanceOf(Buffer);
  });

  it('cropImage throws for invalid dimensions', async () => {
    const { cropImage } = await import('../image-utils');

    await expect(
      cropImage(
        {
          imageId: 'img-1',
          x: 0,
          y: 0,
          width: 0,
          height: 50,
          aspectRatio: 1,
          rotation: 0,
          scale: 1,
        },
        Buffer.from('crop-me'),
      ),
    ).rejects.toThrow('Crop width and height must be greater than zero.');
  });

  it('uploadToStorage uploads to s3 and returns public url', async () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_BUCKET = 'images';
    process.env.S3_REGION = 'eu-west-1';
    process.env.S3_ACCESS_KEY_ID = 'key';
    process.env.S3_SECRET_ACCESS_KEY = 'secret';
    process.env.S3_PUBLIC_URL = 'https://cdn.example.com/public';
    sendMock.mockResolvedValue({});

    const { uploadToStorage } = await import('../image-utils');
    const buffer = Buffer.from('uploaded');
    const url = await uploadToStorage(buffer, 'avatars/user-1.jpg');

    expect(S3ClientMock).toHaveBeenCalledWith({
      region: 'eu-west-1',
      endpoint: 'https://s3.example.com',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      },
    });
    expect(PutObjectCommandMock).toHaveBeenCalledWith({
      Bucket: 'images',
      Key: 'avatars/user-1.jpg',
      Body: buffer,
      ACL: 'public-read',
      ContentType: 'image/jpeg',
    });
    expect(sendMock).toHaveBeenCalled();
    expect(url).toBe('https://cdn.example.com/public/avatars/user-1.jpg');
  });
});
