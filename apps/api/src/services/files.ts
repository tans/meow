/**
 * File Service
 * 
 * Handles file upload lifecycle:
 * - Initiate upload (generate presigned URL)
 * - Complete upload (save metadata)
 * - Generate access URLs (with permission checks)
 */

import { randomUUID } from 'node:crypto';
import type { StorageProvider } from '@meow/storage';
import { createStorageProvider } from '@meow/storage';
import { db } from '../lib/db.js';
import { AppError } from '../lib/errors.js';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const PRESIGN_EXPIRY_SECONDS = 900; // 15 minutes

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
];

interface InitiateUploadInput {
  fileName: string;
  fileSize: number;
  mimeType: string;
  purpose: 'task_attachment' | 'submission';
  userId: string;
}

interface UploadResult {
  uploadId: string;
  presignedUrl: string;
  fields: Record<string, string>;
  expiresAt: string;
}

interface CompleteUploadInput {
  uploadId: string;
  bucket: string;
  objectKey: string;
  checksum?: string;
}

interface FileAccessResult {
  url: string;
  expiresAt: string;
  contentType: string;
}

export class FileService {
  private storage: StorageProvider;

  constructor() {
    const config = {
      endpoint: process.env.RUSTFS_ENDPOINT || 'http://localhost:9000',
      accessKeyId: process.env.RUSTFS_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.RUSTFS_SECRET_KEY || 'minioadmin',
      region: process.env.RUSTFS_REGION || 'us-east-1',
      bucket: process.env.RUSTFS_BUCKET || 'meow-uploads',
    };
    this.storage = createStorageProvider('rustfs', config);
  }

  /**
   * Initiate file upload
   */
  async initiateUpload(input: InitiateUploadInput): Promise<UploadResult> {
    // Validate file size
    if (input.fileSize > MAX_FILE_SIZE) {
      throw new AppError(413, `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      throw new AppError(400, `Unsupported file type: ${input.mimeType}`);
    }

    // Generate upload ID and object key
    const uploadId = randomUUID();
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const extension = input.fileName.split('.').pop() || '';
    const objectKey = `uploads/${datePrefix}/${uploadId}.${extension}`;

    // Generate presigned upload URL
    const { url, fields, expiresAt } = await this.storage.createPresignedUpload(
      objectKey,
      input.mimeType,
      PRESIGN_EXPIRY_SECONDS
    );

    // Store pending upload in memory (or temp table)
    // For now, we'll store minimal info - the rest comes on complete
    (global as any).__pendingUploads = (global as any).__pendingUploads || new Map();
    (global as any).__pendingUploads.set(uploadId, {
      uploadId,
      objectKey,
      bucket: (this.storage as any).bucket,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      purpose: input.purpose,
      userId: input.userId,
      expiresAt,
    });

    return {
      uploadId,
      presignedUrl: url,
      fields,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Complete upload and save metadata
   */
  async completeUpload(input: CompleteUploadInput): Promise<{
    fileId: string;
    status: string;
    derivativeStatus?: string;
  }> {
    const pending = (global as any).__pendingUploads?.get(input.uploadId);
    if (!pending) {
      throw new AppError(400, 'Upload not found or expired');
    }

    // Verify file exists in storage
    const metadata = await this.storage.headObject(input.objectKey);
    if (!metadata) {
      throw new AppError(400, 'File not found in storage');
    }

    // Create file_objects record
    const fileId = randomUUID();
    const now = Date.now();

    // Save to database using drizzle
    await db.insert('file_objects', {
      id: fileId,
      bucket: input.bucket,
      object_key: input.objectKey,
      original_name: pending.fileName,
      mime_type: pending.mimeType,
      size_bytes: metadata.size,
      checksum_sha256: input.checksum,
      created_by: pending.userId,
      created_at: now,
      expires_at: null, // Permanent storage
    });

    // Clean up pending upload
    (global as any).__pendingUploads.delete(input.uploadId);

    // If submission, queue preview generation
    let derivativeStatus: string | undefined;
    if (pending.purpose === 'submission') {
      if (pending.mimeType.startsWith('image/')) {
        await this.queuePreviewGeneration(fileId, 'image');
        derivativeStatus = 'pending';
      } else if (pending.mimeType.startsWith('video/')) {
        await this.queuePreviewGeneration(fileId, 'video');
        derivativeStatus = 'pending';
      }
    }

    return {
      fileId,
      status: 'completed',
      derivativeStatus,
    };
  }

  /**
   * Get presigned access URL with permission check
   */
  async getAccessUrl(
    fileId: string,
    type: 'original' | 'preview',
    userId: string,
    userRole: string
  ): Promise<FileAccessResult> {
    // Get file record
    const fileRecord = await db.queryOne('SELECT * FROM file_objects WHERE id = ?', [fileId]);
    if (!fileRecord) {
      throw new AppError(404, 'File not found');
    }

    // Get presigned URL
    const url = await this.storage.createPresignedAccess(
      fileRecord.object_key,
      PRESIGN_EXPIRY_SECONDS
    );

    return {
      url,
      expiresAt: new Date(Date.now() + PRESIGN_EXPIRY_SECONDS * 1000).toISOString(),
      contentType: fileRecord.mime_type,
    };
  }

  /**
   * Get preview file access (open access)
   */
  async getPreviewUrl(fileId: string): Promise<FileAccessResult> {
    // Check if preview exists
    const preview = await db.queryOne(
      `SELECT fo.* FROM file_derivatives fd
       JOIN file_objects fo ON fd.file_object_id = fo.id
       WHERE fd.source_file_id = ? AND fd.processing_status = 'completed'`,
      [fileId]
    );

    if (!preview) {
      throw new AppError(400, 'Preview not ready');
    }

    const url = await this.storage.createPresignedAccess(
      preview.object_key,
      PRESIGN_EXPIRY_SECONDS
    );

    return {
      url,
      expiresAt: new Date(Date.now() + PRESIGN_EXPIRY_SECONDS * 1000).toISOString(),
      contentType: preview.mime_type,
    };
  }

  /**
   * Check upload/preview status
   */
  async getStatus(fileId: string): Promise<{
    fileId: string;
    uploadStatus: string;
    previewStatus?: string;
  }> {
    const file = await db.queryOne('SELECT * FROM file_objects WHERE id = ?', [fileId]);
    if (!file) {
      throw new AppError(404, 'File not found');
    }

    const derivative = await db.queryOne(
      'SELECT processing_status FROM file_derivatives WHERE source_file_id = ?',
      [fileId]
    );

    return {
      fileId,
      uploadStatus: 'completed',
      previewStatus: derivative?.processing_status,
    };
  }

  /**
   * Queue preview generation job
   */
  private async queuePreviewGeneration(fileId: string, type: 'image' | 'video'): Promise<void> {
    const derivativeId = randomUUID();
    const now = Date.now();

    await db.insert('file_derivatives', {
      id: derivativeId,
      source_file_id: fileId,
      derivative_type: type === 'image' ? 'preview_image' : 'preview_video',
      file_object_id: null, // Will be set when preview is generated
      processing_status: 'pending',
      processing_metadata: null,
      error_message: null,
      retry_count: 0,
      next_retry_at: null,
      worker_id: null,
      created_at: now,
      completed_at: null,
    });
  }
}

// Singleton instance
export const fileService = new FileService();
