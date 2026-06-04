import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

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

function createS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const region = process.env.S3_REGION?.trim() || 'us-east-1';
  const accessKeyId = getRequiredEnv('S3_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnv('S3_SECRET_ACCESS_KEY');

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function buildPublicUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = getRequiredEnv('S3_BUCKET');
  const region = process.env.S3_REGION?.trim() || 'us-east-1';
  const publicBaseUrl = process.env.S3_PUBLIC_URL?.trim();

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  if (endpoint) {
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body && typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }

  if (body && typeof (body as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] === 'function') {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error('Unsupported S3 response body.');
}

export async function uploadToS3({ buffer, key, contentType }: UploadToS3Input): Promise<string> {
  const bucket = getRequiredEnv('S3_BUCKET');
  const client = createS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ACL: 'public-read',
      ContentType: contentType,
    }),
  );

  return buildPublicUrl(key);
}

export async function getObjectFromS3(key: string): Promise<Buffer | null> {
  const bucket = getRequiredEnv('S3_BUCKET');
  const client = createS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      return null;
    }

    return streamToBuffer(response.Body);
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') {
      return null;
    }

    throw error;
  }
}

export async function deleteSessionImagesFromS3(sessionId: string): Promise<boolean> {
  const bucket = getRequiredEnv('S3_BUCKET');
  const client = createS3Client();
  const keys = new Set<string>();

  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${sessionId}/`,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (object.Key) {
        keys.add(object.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'cropped/',
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (object.Key?.includes(sessionId)) {
        keys.add(object.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  if (keys.size === 0) {
    return false;
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: Array.from(keys).map((Key) => ({ Key })),
      },
    }),
  );

  return true;
}
