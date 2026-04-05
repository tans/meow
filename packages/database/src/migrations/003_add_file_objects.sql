-- Migration: Add file_objects table for Rustfs storage system
-- Created: 2026-04-05

CREATE TABLE file_objects (
    id TEXT PRIMARY KEY,
    bucket TEXT NOT NULL,
    object_key TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    checksum_sha256 TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(bucket, object_key)
);

CREATE INDEX idx_file_objects_created_by ON file_objects(created_by);
CREATE INDEX idx_file_objects_expires ON file_objects(expires_at) WHERE expires_at IS NOT NULL;
