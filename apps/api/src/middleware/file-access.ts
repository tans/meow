/**
 * File Access Control Middleware
 * 
 * Enforces permission rules for file downloads:
 * - Preview: Open access (any authenticated user)
 * - Original: Creator or task merchant can download after approval
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../lib/db.js';
import { AppError } from '../lib/errors.js';

interface AccessCheckOptions {
  requireApproval?: boolean;
  allowCreator?: boolean;
  allowTaskMerchant?: boolean;
}

/**
 * Middleware factory for file access control
 */
export function createFileAccessMiddleware(options: AccessCheckOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.id;
      const accessType = (req.query.type as string) || 'preview';
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.activeRole;

      if (!userId) {
        throw new AppError(401, 'Authentication required');
      }

      // Preview access is open to any authenticated user
      if (accessType === 'preview') {
        return next();
      }

      // Original file access requires permission check
      if (accessType === 'original') {
        const hasPermission = await checkOriginalAccessPermission(
          fileId,
          userId,
          userRole,
          options
        );

        if (!hasPermission) {
          throw new AppError(403, 'Access denied to original file');
        }
      }

      // Log access for audit
      await logFileAccess(fileId, accessType as 'original' | 'preview', userId, userRole, req);

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user has permission to access original file
 */
async function checkOriginalAccessPermission(
  fileId: string,
  userId: string,
  userRole: string,
  options: AccessCheckOptions
): Promise<boolean> {
  // Admin can access anything
  if (userRole === 'operator') {
    return true;
  }

  // Find submission associated with this file
  const submissionRef = await (db as any).queryOne?.(
    `SELECT s.*, sfr.original_file_id
     FROM submission_file_refs sfr
     JOIN submissions s ON sfr.submission_id = s.id
     WHERE sfr.original_file_id = ? OR sfr.preview_file_id = ?`,
    [fileId, fileId]
  );

  if (!submissionRef) {
    // Not a submission file - check if it's user's own upload
    const fileRecord = await (db as any).queryOne?.(
      'SELECT created_by FROM file_objects WHERE id = ?',
      [fileId]
    );
    return fileRecord?.created_by === userId;
  }

  // Creator can always access their own files
  if (options.allowCreator !== false && submissionRef.creator_id === userId) {
    return true;
  }

  // Check if submission is approved (required for merchant access)
  if (options.requireApproval !== false && submissionRef.status !== 'approved') {
    return false;
  }

  // Task merchant can access approved submissions
  if (options.allowTaskMerchant !== false) {
    const task = await (db as any).queryOne?.(
      'SELECT merchant_id FROM tasks WHERE id = ?',
      [submissionRef.task_id]
    );
    if (task?.merchant_id === userId) {
      return true;
    }
  }

  return false;
}

/**
 * Log file access for audit
 */
async function logFileAccess(
  fileId: string,
  fileType: 'original' | 'preview',
  userId: string,
  userRole: string,
  req: Request
): Promise<void> {
  // Only log original file access (not previews)
  if (fileType === 'preview') {
    return;
  }

  try {
    await (db as any).insert?.('file_access_logs', {
      id: randomUUID(),
      file_id: fileId,
      file_type: fileType,
      user_id: userId,
      user_role: userRole || 'unknown',
      access_method: 'api',
      ip_address: req.ip || null,
      user_agent: req.headers['user-agent']?.substring(0, 500) || null,
      accessed_at: Date.now(),
    });
  } catch (error) {
    // Log error but don't block the request
    console.error('Failed to log file access:', error);
  }
}

// Pre-configured middleware instances
export const requireOriginalAccess = createFileAccessMiddleware({
  requireApproval: true,
  allowCreator: true,
  allowTaskMerchant: true,
});
