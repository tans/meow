/**
 * File Routes
 * 
 * API endpoints for file upload and access management.
 */

import { Router } from 'express';
import { z } from 'zod';
import { fileService } from '../services/files.js';
import { requireAuth } from '../lib/session.js';
import { AppError } from '../lib/errors.js';

const router = Router();

// Upload initiation schema
const initiateUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(500 * 1024 * 1024),
  mimeType: z.string(),
  purpose: z.enum(['task_attachment', 'submission']),
});

// Upload completion schema
const completeUploadSchema = z.object({
  uploadId: z.string().uuid(),
  bucket: z.string(),
  objectKey: z.string(),
  checksum: z.string().optional(),
});

/**
 * POST /files/upload-init
 * Initiate file upload, return presigned URL
 */
router.post('/upload-init', requireAuth, async (req, res, next) => {
  try {
    const input = initiateUploadSchema.parse(req.body);
    
    const result = await fileService.initiateUpload({
      ...input,
      userId: req.user!.userId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /files/upload-complete
 * Complete upload, save metadata
 */
router.post('/upload-complete', requireAuth, async (req, res, next) => {
  try {
    const input = completeUploadSchema.parse(req.body);
    
    const result = await fileService.completeUpload(input);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /files/:id/access
 * Get presigned access URL
 */
router.get('/:id/access', requireAuth, async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const type = req.query.type as 'original' | 'preview' || 'preview';
    
    let result;
    if (type === 'preview') {
      // Preview is open access (no permission check needed)
      result = await fileService.getPreviewUrl(fileId);
    } else {
      // Original requires permission check
      result = await fileService.getAccessUrl(
        fileId,
        type,
        req.user!.userId,
        req.user!.activeRole
      );
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /files/:id/status
 * Check upload/preview status
 */
router.get('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const result = await fileService.getStatus(fileId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
