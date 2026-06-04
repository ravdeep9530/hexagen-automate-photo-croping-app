import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface UploadToS3Input {
  buffer: Buffer;
  key: string;
  contentType: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required storage configuration: ${name}`);
  }

  return value;
}

export async function uploadToS3({ buffer, key, contentType }: UploadToS3Input): Promise<string> {
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
      Key: key,
      Body: buffer,
      ACL: 'public-read',
      ContentType: contentType,
    }),
  );

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  if (endpoint) {
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
