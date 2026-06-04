import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

import type { CropParameters } from '../types/crop-parameters';

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export async function validateImage(file: Buffer, mimetype: string): Promise<boolean> {
  return file.length > 0 && file.length <= MAX_IMAGE_SIZE_BYTES && SUPPORTED_MIME_TYPES.has(mimetype);
}

export async function cropImage(params: CropParameters, file: Buffer): Promise<Buffer> {
  const { x, y, width, height } = params;

  return sharp(file)
    .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(width), height: Math.round(height) })
    .toBuffer();
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function uploadToStorage(buffer: Buffer, filename: string): Promise<string> {
  const region = getRequiredEnv('AWS_REGION');
  const bucket = getRequiredEnv('AWS_S3_BUCKET');
  const accessKeyId = getRequiredEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnv('AWS_SECRET_ACCESS_KEY');
  const endpoint = process.env.AWS_S3_ENDPOINT;
  const publicBaseUrl = process.env.AWS_S3_PUBLIC_URL;

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: Boolean(endpoint),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ACL: 'public-read',
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
