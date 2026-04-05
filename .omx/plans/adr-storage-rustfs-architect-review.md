# ADR: Rustfs Storage System - Architectural Review

**Status**: ITERATE  
**Reviewer**: Architect (Oracle)  
**Date**: 2025-04-05  
**Scope**: PRD Review + Steelman Analysis  

---

## Summary

The Rustfs storage system PRD presents a sound high-level approach to S3-compatible object storage with async preview generation. However, **several architectural concerns require iteration** before implementation proceeds, particularly around migration strategy, access control enforcement, queue reliability, and the lack of storage abstraction verification.

**Verdict: ITERATE** — proceed with Phase 1 after addressing critical issues marked 🔴 below.

---

## 1. Storage Abstraction Assessment

### Current Design
The PRD proposes a Rustfs client wrapper with S3-compatible API:

```typescript
// packages/storage/src/rustfs-client.ts
export class RustfsClient {
  createPresignedUpload(key: string, mimeType: string, expiresSeconds: number): PresignedUrl;
  createPresignedAccess(key: string, expiresSeconds: number): string;
  deleteObject(key: string): Promise<void>;
  headObject(key: string): Promise<ObjectMetadata>;
}
```

### Strengths
- **S3-compatible abstraction** enables future provider swaps (MinIO, AWS S3, etc.)
- **Presigned URL pattern** correctly delegates auth to storage layer
- **Interface-based design** in `packages/storage/` supports clean separation

### 🔴 Critical Gap: No Abstraction Interface
The PRD shows `RustfsClient` as concrete implementation, not an interface. This creates tight coupling:

```typescript
// Current (tight coupling)
import { RustfsClient } from "@meow/storage/rustfs-client";
const client = new RustfsClient(config);

// Should be (loose coupling)
import type { StorageProvider } from "@meow/storage";
const client: StorageProvider = createStorageProvider("rustfs", config);
```

**Evidence**: `apps/api/src/lib/uploads.ts:12-70` shows current fs-based implementation tightly coupled to local filesystem.

**Recommendation**: Define a `StorageProvider` interface with Rustfs as first implementation.

---

## 2. Preview Generation Queue Analysis

### Async Queue Approach
```typescript
export class PreviewQueue {
  enqueue(fileId: string, type: 'image' | 'video'): Promise<void>;
  processNext(): Promise<void>;
}
```

### 🟡 Tradeoff Tension: In-Process vs External Queue

| Aspect | In-Process Queue (PRD) | External Queue (Bull/Redis) |
|--------|----------------------|----------------------------|
| **Complexity** | Low — no infra deps | High — requires Redis |
| **Reliability** | Process death = lost jobs | Persistent, restart-safe |
| **Scalability** | Single-node only | Multi-worker capable |
| **Observability** | Custom logging needed | Built-in dashboards |
| **Retry Logic** | Manual implementation | Built-in exponential backoff |

### 🔴 Steelman Antithesis: What Could Go Wrong

**Scenario 1: Queue Loss on Deploy**
- Creator uploads 500MB video → queued for preview generation
- API redeploys before processing completes → job lost
- Preview stays "pending" forever, user confused

**Scenario 2: Transcode Timeout Cascade**
- Video transcode takes 45 seconds (PRD target: 30s)
- Next video starts while first still running
- Memory pressure builds → OOM kills → all jobs lost

**Scenario 3: No Retry on Failure**
- `ffmpeg` fails due to corrupt video → job marked "failed"
- No automatic retry → manual intervention required
- User sees permanent "preview generation failed"

### Recommendations

1. **Immediate**: Add SQLite-backed job persistence:
   ```sql
   -- Add to file_derivatives table
   retry_count INTEGER DEFAULT 0,
   next_retry_at DATETIME,
   UNIQUE constraint to prevent duplicate jobs
   ```

2. **Phase 2**: Consider PostgreSQL with `pg-boss` or similar for production scale

3. **Worker isolation**: Run preview worker as separate process to prevent blocking API:
   ```
   apps/api/src/workers/preview-worker.ts  // Separate entry point
   ```

---

## 3. Sharp/ffmpeg Dependency Analysis

### Image Processing (Sharp)
```typescript
async generateImagePreview(sourcePath: string, outputPath: string): Promise<void>;
// Implementation: sharp(sourcePath).resize(480).toFile(outputPath)
```

**Verdict**: ✅ Sharp is industry standard, well-maintained, fast.

### Video Processing (ffmpeg)
```typescript
async generateVideoPreview(sourcePath: string, outputPath: string): Promise<void>;
// Implementation: ffmpeg -i input -b:v {originalBitrate * 0.3} output
```

### 🟡 Concerns

1. **Binary Dependency**: ffmpeg must be installed on all deployment targets
2. **Security Risk**: Video parsing is attack surface (malformed files → RCE)
3. **Resource Exhaustion**: 4K video transcode can consume 2GB+ RAM

**Mitigations from PRD**: Async queue prevents blocking, but doesn't address resource limits.

**Additional Recommendations**:
- Use `fluent-ffmpeg` with timeout and memory limits
- Containerize with resource constraints (`--memory=4g`)
- Consider sandboxing (gVisor, Firecracker) for untrusted video processing

---

## 4. Database Schema Review

### file_objects Table
```sql
CREATE TABLE file_objects (
  id TEXT PRIMARY KEY,           -- UUID
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,      -- storage path
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum_sha256 TEXT,          -- optional integrity check
  created_by TEXT NOT NULL,      -- uploader user_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,           -- auto-delete (NULL=permanent)
  UNIQUE(bucket, object_key)
);
```

**Verdict**: ✅ Sound design

### file_derivatives Table
```sql
CREATE TABLE file_derivatives (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL,  -- original file
  derivative_type TEXT NOT NULL, -- 'preview_image', 'preview_video'
  file_object_id TEXT NOT NULL,  -- preview's own file_objects row
  processing_status TEXT DEFAULT 'pending',
  processing_metadata TEXT,      -- JSON: { width, height, bitrate }
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (source_file_id) REFERENCES file_objects(id),
  FOREIGN KEY (file_object_id) REFERENCES file_objects(id)
);
```

### 🟡 Issues

1. **No retry tracking**: `retry_count`, `next_retry_at` missing
2. **Self-referential FK**: `file_object_id` → `file_objects` creates circular dependency if `file_derivatives` owns the preview file
3. **No unique constraint on derivatives**: Could create duplicate preview jobs

**Recommended Fix**:
```sql
-- Add constraint to prevent duplicate derivative types
UNIQUE(source_file_id, derivative_type)

-- Add retry tracking
ALTER TABLE file_derivatives ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE file_derivatives ADD COLUMN next_retry_at DATETIME;

-- For idempotency
CREATE INDEX idx_derivatives_retry ON file_derivatives(processing_status, next_retry_at) 
WHERE processing_status = 'pending' OR processing_status = 'failed';
```

### Migration Strategy: DROP AND RECREATE

**PRD Statement**: "现有本地存储测试数据直接丢弃，不做迁移"

### 🔴 Steelman Antithesis: Migration Risk

**What if this assumption is wrong?**

1. **"Test data only"**: What if production data exists in local storage?
2. **External references**: Other tables may reference `asset_url` strings containing local paths
3. **Rollback impossibility**: Once deployed, local files are orphaned

**Evidence Check**: Current schema in `packages/database/src/schema.ts:45-54`:
```typescript
export const submissions = sqliteTable("submissions", {
  // ...
  assetUrl: text("asset_url").notNull(),  // String URL, not FK
  // ...
});
```

`asset_url` is a free-text string. Migration requires:
1. Backing up all local files
2. Uploading to Rustfs
3. Updating all `asset_url` values
4. OR accepting data loss

**Recommendation**: 
- **Do not proceed with "drop and recreate"** until verified no production data
- Implement migration script that:
  1. Reads local files
  2. Uploads to Rustfs
  3. Creates `file_objects` records
  4. Updates `submissions.asset_url` → `submissions.original_file_id`

---

## 5. Access Control Analysis

### Presigned URL Security Model

```typescript
// API generates time-limited URL
GET /api/files/:fileId/access?type=preview|original
Response: {
  "url": "https://rustfs.example.com/...?signature=...",
  "expiresAt": "2025-04-05T12:15:00Z"
}
```

### Permission Matrix (from Deep Interview)

| Role | Preview | Original (pending) | Original (approved) |
|------|---------|-------------------|---------------------|
| Creator (owner) | ✅ | ✅ | ✅ |
| Merchant (task owner) | ✅ | ❌ | ✅ |
| Other creators | ✅ | ❌ | ❌ |
| Other merchants | ✅ | ❌ | ❌ |
| Unauthenticated | ✅ | ❌ | ❌ |

### 🔴 Security Concern: Preview "Open" Access

PRD states: "预览版访问不限制权限" (preview access unrestricted)

**But** Deep Interview clarifies: "预览版：开放查看权限" (open viewing)

**Steelman Antithesis**: If preview URL leaks, anyone can view creator's work before approval. This violates "创作者权益保护" (creator rights protection).

**Attack scenario**:
1. Merchant views preview, copies presigned URL
2. Shares URL with competitor
3. Competitor views work before approval → IP theft

**Root Cause**: Presigned URL is bearer token — anyone with URL has access until expiry.

### Recommendations

1. **Short expiry**: 5-15 minutes max (PRD says 15min — ✅ good)

2. **URL binding**: Include user session fingerprint in signature check:
   ```typescript
   // Check that requesting user matches URL grant
   if (urlGrant.grantedTo !== currentUser.id) {
     return 403; // URL was shared
   }
   ```
   
   **Tradeoff**: Prevents sharing but breaks "refresh page" scenarios. Needs careful UX design.

3. **Audit logging**: Log all original file access (not previews):
   ```sql
   CREATE TABLE file_access_logs (
     id TEXT PRIMARY KEY,
     file_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     access_type TEXT NOT NULL, -- 'preview', 'original'
     accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     ip_address TEXT
   );
   ```

4. **Rate limiting**: Prevent brute-force URL guessing on `/api/files/:id/access`

---

## 6. Additional Concerns

### 6.1 No Content-Type Validation on Upload

PRD: "自动识别文件类型" — but how?

**Risk**: Client could upload `.exe` renamed to `.jpg`, server accepts based on extension.

**Recommendation**: Validate MIME type via file magic bytes (not just extension), using libraries like `file-type`.

### 6.2 Missing Storage Consistency Guarantees

**Scenario**: Upload succeeds to Rustfs, but `upload-complete` callback fails (network blip).

**Result**: Orphaned file in Rustfs, no database record → storage leak.

**Mitigation**: 
- Background job to scan Rustfs for unreferenced objects
- Or: Transactional outbox pattern

### 6.3 No Storage Quotas

Creators could upload unlimited 500MB files. No per-user or per-task limits defined.

**Recommendation**: Add `quota_used_bytes`, `quota_limit_bytes` to users table.

---

## Steelman Antithesis Summary

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Queue job loss on deploy | Medium | High | SQLite-backed persistence |
| ffmpeg security vulnerability | Low | Critical | Sandbox, resource limits |
| Migration data loss | Medium | High | Verify no prod data; migration script |
| Preview URL sharing → IP theft | Medium | Medium | Short expiry + audit logging |
| Storage inconsistency (orphaned files) | Medium | Medium | Background cleanup job |
| No retry on failed transcode | High | Medium | Add retry_count, next_retry_at |

---

## Tradeoff Tensions

### Tension 1: Security vs UX
- **Security**: Bind URLs to user session, prevent sharing
- **UX**: Users expect to refresh page, share preview with team
- **Synthesis**: Keep open previews (current), but add audit logging and shorter expiry (5min)

### Tension 2: Simplicity vs Reliability
- **Simplicity**: In-process queue, no external deps
- **Reliability**: External queue (Redis) with persistence
- **Synthesis**: Start with SQLite-backed in-process queue, migrate to external if scale demands

### Tension 3: Migration Safety vs Speed
- **Safety**: Full migration script, preserve all data
- **Speed**: Drop and recreate, start fresh
- **Synthesis**: Verify assumption (no prod data), then decide. If any doubt, implement migration.

---

## Recommendations

### 🔴 Must Fix Before Phase 1
1. **Verify migration assumption**: Confirm no production data in local storage
2. **Add StorageProvider interface**: Abstract Rustfs behind interface
3. **Add queue persistence**: SQLite-backed job state with retry tracking
4. **Add audit logging**: Track original file access

### 🟡 Should Fix Before Phase 2 (Preview Generation)
1. **Resource limits**: ffmpeg memory/time limits
2. **URL binding**: Optional user-session binding for high-sensitivity files
3. **MIME validation**: Magic byte validation, not just extension

### 🟢 Can Defer to Future Iteration
1. External queue (Redis/Bull)
2. Storage quotas
3. CDN integration
4. Background cleanup job for orphaned files

---

## Consensus Verdict

**ITERATE** — The architecture is directionally correct but needs refinement before implementation.

### Critical Path to APPROVE
1. ✅ Storage abstraction interface defined
2. ✅ Queue persistence mechanism specified (SQLite-backed)
3. ✅ Migration strategy verified (prod data check)
4. ✅ Audit logging added for original file access

Once these are addressed in the PRD, the design can proceed to implementation.

---

## References

- `apps/api/src/lib/uploads.ts:12-70` — Current fs-based implementation
- `packages/database/src/schema.ts:45-54` — Current submissions table with `asset_url`
- `packages/database/src/repository.ts:42-51` — TaskAssetAttachmentRecord interface
- `.omx/plans/prd-storage-rustfs.md` — PRD under review
- `.omx/plans/test-spec-storage-rustfs.md` — Test specifications
- `.omx/specs/deep-interview-storage-material-work.md` — Requirements clarification
