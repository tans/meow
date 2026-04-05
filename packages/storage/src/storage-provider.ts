import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type { PresignedPostOptions } from "@aws-sdk/s3-presigned-post";
import type {
  StorageConfig,
  StorageProvider,
  PresignedUploadResult,
  ObjectMetadata,
  StorageProviderType,
} from "./types.js";

export class RustfsStorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private providerType: StorageProviderType = "rustfs";

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  getProviderType(): string {
    return this.providerType;
  }

  async createPresignedUpload(
    key: string,
    mimeType: string,
    expiresSeconds: number
  ): Promise<PresignedUploadResult> {
    const options: PresignedPostOptions = {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresSeconds,
      Fields: {
        "Content-Type": mimeType,
      },
    };
    const { url, fields } = await createPresignedPost(this.client, options);
    return {
      url,
      fields,
      expiresAt: new Date(Date.now() + expiresSeconds * 1000),
    };
  }

  async createPresignedAccess(key: string, expiresSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async headObject(key: string): Promise<ObjectMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      if (!response.LastModified || !response.ContentLength || !response.ETag) {
        return null;
      }
      return {
        key,
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType || "application/octet-stream",
        etag: response.ETag.replace(/"/g, ""),
      };
    } catch (error: unknown) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async uploadBuffer(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    });
    await this.client.send(command);
  }
}

export function createStorageProvider(
  type: StorageProviderType,
  config: StorageConfig
): StorageProvider {
  switch (type) {
    case "rustfs":
      return new RustfsStorageProvider(config);
    case "minio":
      return new RustfsStorageProvider(config);
    case "s3":
      return new RustfsStorageProvider(config);
    default:
      throw new Error(`Unsupported storage provider type: ${type}`);
  }
}

export type {
  StorageConfig,
  StorageProvider,
  PresignedUploadResult,
  ObjectMetadata,
  StorageProviderType,
};
