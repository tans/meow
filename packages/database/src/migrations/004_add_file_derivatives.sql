-- Migration: Add file_derivatives table for Rustfs storage system
-- Created: 2026-04-05

CREATE TABLE file_derivatives (
    id TEXT PRIMARY KEY,
    source_file_id TEXT NOT NULL,
    derivative_type TEXT NOT NULL,
    file_object_id TEXT NOT NULL,
    processing_status TEXT DEFAULT 'pending',
    processing_metadata TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at DATETIME,
    worker_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (source_file_id) REFERENCES file_objects(id),
    FOREIGN KEY (file_object_id) REFERENCES file_objects(id)
);

CREATE UNIQUE INDEX idx_derivatives_unique_type ON file_derivatives(source_file_id, derivative_type);
CREATE INDEX idx_derivatives_pending ON file_derivatives(processing_status, next_retry_at) 
    WHERE processing_status IN ('pending', 'failed');
