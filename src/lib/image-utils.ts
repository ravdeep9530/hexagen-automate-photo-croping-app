import sharp from 'sharp';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { CropParameters } from '@/types/crop-parameters';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const FORMAT_TO_MIME_TYPE: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required storage configuration: ${name}`);
  }

  return value;
}

export async function validateImage(file: Buffer, mimetype: string): Promise<boolean> {
  if (!Buffer.isBuffer(file) || file.length === 0 || file.length > MAX_IMAGE_SIZE_BYTES) {
    return false;
  }

  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    return false;
  }

  try {
    const metadata = await sharp(file).metadata();
    const detectedMimeType = metadata.format ? FORMAT_TO_MIME_TYPE[metadata.format] : undefined;

    if (!detectedMimeType || detectedMimeType !== mimetype) {
      return false;
    }

    return Boolean(metadata.width && metadata.height && metadata.width > 0 && metadata.height > 0);
  } catch {
    return false;
  }
}

export async function cropImage(params: CropParameters, file: Buffer): Promise<Buffer> {
  const width = Math.round(params.width);
  const height = Math.round(params.height);
  const left = Math.round(params.x);
  const top = Math.round(params.y);

  if ([width, height, left, top].some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Invalid crop parameters.');
  }

  if (width === 0 || height === 0) {
    throw new Error('Crop width and height must be greater than zero.');
  }

  return sharp(file)
    .extract({ left, top, width, height })
    .toBuffer();
}

export async function uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = getRequiredEnv('S3_BUCKET');
  const region = process.env.S3_REGION?.trim() || 'us-east-1';
  const accessKeyId = getRequiredEnv('S3_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnv('S3_SECRET_ACCESS_KEY');
  const publicBaseUrl = process.env.S3_PUBLIC_URL?.trim();

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ACL: 'public-read',
      ContentType: 'image/jpeg',
    }),
  );

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${filename}`;
  }

  if (endpoint) {
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${filename}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
}
