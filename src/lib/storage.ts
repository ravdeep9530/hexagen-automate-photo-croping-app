import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export type StorageUploadInput = {
  body: Buffer;
  contentType: string;
  key: string;
};

export type StorageUploadResult = {
  url: string;
};

export type StorageObject = {
  body: Buffer;
  contentType: string | null;
};

export type StorageClient = {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  getObject(key: string): Promise<StorageObject | null>;
  deleteAllForSession(sessionId: string): Promise<boolean>;
};

type ListedObject = {
  Key?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function streamToBuffer(stream: { transformToByteArray?: () => Promise<Uint8Array> } | null | undefined): Promise<Buffer> {
  if (!stream) {
    return Buffer.alloc(0);
  }

  if (typeof stream.transformToByteArray === 'function') {
    return Buffer.from(await stream.transformToByteArray());
  }

  throw new Error('Unsupported storage response body');
}

class S3StorageClient implements StorageClient {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string | undefined;
  private readonly publicBaseUrl: string | undefined;

  constructor() {
    this.region = getRequiredEnv('AWS_REGION');
    this.bucket = getRequiredEnv('AWS_S3_BUCKET');
    const accessKeyId = getRequiredEnv('AWS_ACCESS_KEY_ID');
    const secretAccessKey = getRequiredEnv('AWS_SECRET_ACCESS_KEY');
    this.endpoint = process.env.AWS_S3_ENDPOINT;
    this.publicBaseUrl = process.env.AWS_S3_PUBLIC_URL;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      forcePathStyle: Boolean(this.endpoint),
    });
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ACL: 'public-read',
      }),
    );

    return {
      url: this.getPublicUrl(input.key),
    };
  }

  async getObject(key: string): Promise<StorageObject | null> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      return null;
    }

    return {
      body: await streamToBuffer(response.Body as { transformToByteArray?: () => Promise<Uint8Array> }),
      contentType: response.ContentType ?? null,
    };
  }

  async deleteAllForSession(sessionId: string): Promise<boolean> {
    const uploadedResponse = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: `uploads/${sessionId}/`,
      }),
    );

    const uploadedKeys = this.extractKeys(uploadedResponse.Contents as ListedObject[] | undefined);

    if (uploadedKeys.length === 0) {
      return false;
    }

    await Promise.all(
      uploadedKeys.map((key: string) => this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))),
    );

    for (const key of uploadedKeys) {
      await this.deleteCroppedObjectsForUploadKey(key);
    }

    return true;
  }

  private extractKeys(objects: ListedObject[] | undefined): string[] {
    return (objects ?? [])
      .map((object: ListedObject) => object.Key)
      .filter((key: string | undefined): key is string => Boolean(key));
  }

  private async deleteCroppedObjectsForUploadKey(uploadKey: string): Promise<void> {
    const croppedResponse = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: `cropped/${uploadKey}/`,
      }),
    );

    const croppedKeys = this.extractKeys(croppedResponse.Contents as ListedObject[] | undefined);

    await Promise.all(
      croppedKeys.map((key: string) => this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))),
    );
  }

  private getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

export function createStorageClient(): StorageClient {
  return new S3StorageClient();
}
