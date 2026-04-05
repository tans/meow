/**
 * @meow/storage
 *
 * Storage provider abstraction for S3-compatible backends.
 * Supports Rustfs, MinIO, AWS S3, and other S3-compatible storage systems.
 */

// Export types
export type {
  StorageConfig,
  StorageProvider,
  PresignedUploadResult,
  ObjectMetadata,
  StorageProviderType,
} from './types.js';

// Export implementation
export {
  RustfsStorageProvider,
  createStorageProvider,
} from './storage-provider.js';
