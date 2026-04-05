-- Migration: Add file_access_logs table for Rustfs storage system
-- Created: 2026-04-05

CREATE TABLE file_access_logs (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    file_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_role TEXT NOT NULL,
    access_method TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES file_objects(id)
);

CREATE INDEX idx_access_logs_file ON file_access_logs(file_id);
CREATE INDEX idx_access_logs_user ON file_access_logs(user_id);
CREATE INDEX idx_access_logs_time ON file_access_logs(accessed_at);
