/**
 * Storage Provider Types
 * 
 * Abstract interface for S3-compatible storage backends.
 * Supports Rustfs, MinIO, AWS S3, etc.
 */

export interface StorageConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export interface PresignedUploadResult {
  url: string;
  fields: Record<string, string>;
  expiresAt: Date;
}

export interface ObjectMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
  etag: string;
}

export interface StorageProvider {
  /** Provider type identifier */
  getProviderType(): string;
  
  /** Generate presigned URL for upload */
  createPresignedUpload(
    key: string,
    mimeType: string,
    expiresSeconds: number
  ): Promise<PresignedUploadResult>;
  
  /** Generate presigned URL for access */
  createPresignedAccess(
    key: string,
    expiresSeconds: number
  ): Promise<string>;
  
  /** Delete object from storage */
  deleteObject(key: string): Promise<void>;
  
  /** Get object metadata */
  headObject(key: string): Promise<ObjectMetadata | null>;
  
  /** Upload buffer directly (for migration/seed) */
  uploadBuffer(key: string, buffer: Buffer, mimeType: string): Promise<void>;
}

export type StorageProviderType = 'rustfs' | 'minio' | 's3';
