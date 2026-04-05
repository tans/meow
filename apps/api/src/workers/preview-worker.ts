/**
 * Preview Generation Worker
 * 
 * Background process that handles async preview generation.
 * Can be run as a separate process or scheduled job.
 * 
 * Usage: node dist/workers/preview-worker.js
 */

import { createStorageProvider } from '@meow/storage';
import { PreviewGenerator } from '../services/preview-generator.js';
import { db } from '../lib/db.js';

const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [60000, 300000, 900000]; // 1min, 5min, 15min

interface PreviewJob {
  id: string;
  source_file_id: string;
  derivative_type: string;
  retry_count: number;
}

async function startPreviewWorker() {
  console.log('Starting preview generation worker...');

  const storage = createStorageProvider('rustfs', {
    endpoint: process.env.RUSTFS_ENDPOINT || 'http://localhost:9000',
    accessKeyId: process.env.RUSTFS_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.RUSTFS_SECRET_KEY || 'minioadmin',
    region: process.env.RUSTFS_REGION || 'us-east-1',
    bucket: process.env.RUSTFS_BUCKET || 'meow-uploads',
  });

  const generator = new PreviewGenerator();

  // Main loop
  while (true) {
    try {
      const job = await dequeueJob();
      
      if (!job) {
        // No jobs available, wait before polling again
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      console.log(`Processing preview job: ${job.id} (attempt ${job.retry_count + 1})`);
      await processJob(job, storage, generator);
    } catch (error) {
      console.error('Worker error:', error);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

async function dequeueJob(): Promise<PreviewJob | null> {
  // Get next pending job from database
  // This is a simplified version - in production use proper queue
  const jobs = await (db as any).query?.(
    `SELECT * FROM file_derivatives
     WHERE processing_status IN ('pending', 'failed')
     AND (next_retry_at IS NULL OR next_retry_at <= ?)
     AND retry_count < ?
     ORDER BY created_at ASC
     LIMIT 1`,
    [Date.now(), MAX_RETRIES]
  );

  return jobs?.[0] || null;
}

async function processJob(
  job: PreviewJob,
  storage: any,
  generator: PreviewGenerator
): Promise<void> {
  const startTime = Date.now();

  try {
    // Mark as processing
    await updateJobStatus(job.id, 'processing');

    // Get source file info
    const sourceFile = await (db as any).queryOne?.(
      'SELECT * FROM file_objects WHERE id = ?',
      [job.source_file_id]
    );

    if (!sourceFile) {
      throw new Error('Source file not found');
    }

    // Download source file from storage
    const presignedUrl = await storage.createPresignedAccess(
      sourceFile.object_key,
      300
    );

    const response = await fetch(presignedUrl);
    if (!response.ok) {
      throw new Error(`Failed to download source file: ${response.status}`);
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer());

    // Generate preview
    let result;
    if (job.derivative_type === 'preview_image') {
      result = await generator.generateImagePreview(
        sourceBuffer,
        sourceFile.mime_type
      );
    } else if (job.derivative_type === 'preview_video') {
      result = await generator.generateVideoPreview(
        sourceBuffer,
        sourceFile.mime_type
      );
    } else {
      throw new Error(`Unknown derivative type: ${job.derivative_type}`);
    }

    if (!result.success || !result.outputPath) {
      throw new Error(result.error || 'Preview generation failed');
    }

    // Read generated file
    const { readFile } = await import('node:fs/promises');
    const previewBuffer = await readFile(result.outputPath);

    // Upload preview to storage
    const previewId = crypto.randomUUID();
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const previewKey = `previews/${datePrefix}/${previewId}.jpg`;

    await storage.uploadBuffer(
      previewKey,
      previewBuffer,
      job.derivative_type === 'preview_video' ? 'video/mp4' : 'image/jpeg'
    );

    // Create file_objects record for preview
    await (db as any).insert?.('file_objects', {
      id: previewId,
      bucket: (storage as any).bucket,
      object_key: previewKey,
      original_name: `preview_${sourceFile.original_name}`,
      mime_type: job.derivative_type === 'preview_video' ? 'video/mp4' : 'image/jpeg',
      size_bytes: previewBuffer.length,
      checksum_sha256: null,
      created_by: sourceFile.created_by,
      created_at: Date.now(),
      expires_at: null,
    });

    // Update derivative record
    await (db as any).query?.(
      `UPDATE file_derivatives
       SET file_object_id = ?,
           processing_status = 'completed',
           processing_metadata = ?,
           completed_at = ?
       WHERE id = ?`,
      [
        previewId,
        JSON.stringify(result.metadata || {}),
        Date.now(),
        job.id,
      ]
    );

    // Cleanup temp file
    await generator.cleanup(result.outputPath);

    const duration = Date.now() - startTime;
    console.log(`Preview generated successfully: ${job.id} (${duration}ms)`);

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    await handleJobFailure(job, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function updateJobStatus(jobId: string, status: string): Promise<void> {
  await (db as any).query?.(
    'UPDATE file_derivatives SET processing_status = ? WHERE id = ?',
    [status, jobId]
  );
}

async function handleJobFailure(job: PreviewJob, errorMessage: string): Promise<void> {
  const newRetryCount = job.retry_count + 1;

  if (newRetryCount >= MAX_RETRIES) {
    // Permanent failure
    await (db as any).query?.(
      `UPDATE file_derivatives
       SET processing_status = 'failed',
           error_message = ?,
           retry_count = ?
       WHERE id = ?`,
      [errorMessage, newRetryCount, job.id]
    );
    console.error(`Job ${job.id} failed permanently after ${MAX_RETRIES} retries`);
  } else {
    // Schedule retry
    const delayMs = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)];
    const nextRetryAt = Date.now() + delayMs;

    await (db as any).query?.(
      `UPDATE file_derivatives
       SET processing_status = 'pending',
           error_message = ?,
           retry_count = ?,
           next_retry_at = ?
       WHERE id = ?`,
      [errorMessage, newRetryCount, nextRetryAt, job.id]
    );
    console.log(`Job ${job.id} scheduled for retry ${newRetryCount} at ${new Date(nextRetryAt).toISOString()}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start worker
startPreviewWorker().catch(console.error);
