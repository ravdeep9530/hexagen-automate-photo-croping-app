import { beforeEach, describe, expect, it, vi } from 'vitest';

const metadataMock = vi.fn();
const extractMock = vi.fn();
const jpegMock = vi.fn();
const toBufferMock = vi.fn();
const sharpMock = vi.fn((input: Buffer) => ({
  metadata: metadataMock,
  extract: extractMock.mockImplementation(({ left, top, width, height }) => ({
    jpeg: jpegMock.mockImplementation(() => ({
      toBuffer: toBufferMock.mockImplementation(() =>
        Promise.resolve(Buffer.from(`${input.toString('hex')}:${left},${top},${width},${height}`)),
      ),
    })),
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
const GetObjectCommandMock = vi.fn(function GetObjectCommand(this: { input: unknown }, input) {
  this.input = input;
});

vi.mock('sharp', () => ({
  default: sharpMock,
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: S3ClientMock,
  PutObjectCommand: PutObjectCommandMock,
  GetObjectCommand: GetObjectCommandMock,
}));

describe('image-utils', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    metadataMock.mockReset();
    extractMock.mockReset();
    jpegMock.mockReset();
    toBufferMock.mockReset();
    sendMock.mockReset();
    S3ClientMock.mockClear();
    PutObjectCommandMock.mockClear();
    GetObjectCommandMock.mockClear();
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

  it('cropImage extracts the requested region after validating bounds and aspect ratio', async () => {
    metadataMock.mockResolvedValue({ format: 'jpeg', width: 500, height: 400 });
    const { cropImage } = await import('../image-utils');
    const file = Buffer.from('crop-me');

    const result = await cropImage(
      {
        imageId: 'img-1',
        x: 12.4,
        y: 9.6,
        width: 120.2,
        height: 120.4,
        aspectRatio: 1,
      },
      file,
    );

    expect(extractMock).toHaveBeenCalledWith({ left: 12, top: 10, width: 120, height: 120 });
    expect(jpegMock).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Buffer);
  });

  it('validateCropBounds throws for out-of-bounds crop areas', async () => {
    const { validateCropBounds } = await import('../image-utils');

    expect(() =>
      validateCropBounds(
        {
          imageId: 'img-1',
          x: 50,
          y: 40,
          width: 200,
          height: 200,
          aspectRatio: 1,
        },
        { width: 200, height: 200 },
      ),
    ).toThrow('Crop area exceeds the image bounds.');
  });

  it('validateCropBounds throws when aspect ratio is outside tolerance', async () => {
    const { validateCropBounds } = await import('../image-utils');

    expect(() =>
      validateCropBounds(
        {
          imageId: 'img-1',
          x: 0,
          y: 0,
          width: 120,
          height: 100,
          aspectRatio: 1,
        },
        { width: 300, height: 300 },
      ),
    ).toThrow('Crop aspect ratio does not match the requested aspect ratio.');
  });

  it('getImageMetadata throws when dimensions cannot be determined', async () => {
    metadataMock.mockResolvedValue({ format: 'jpeg', width: undefined, height: 300 });
    const { getImageMetadata } = await import('../image-utils');

    await expect(getImageMetadata(Buffer.from('bad-image'))).rejects.toThrow('Unable to determine image dimensions.');
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
