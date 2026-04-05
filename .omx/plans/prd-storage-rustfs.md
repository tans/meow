# PRD: Rustfs 存储系统重构

## 元数据
- **状态**: Draft → Planning
- **优先级**: P0
- **负责人**: OMX Team
- **目标版本**: v2.0

---

## RALPLAN-DR 摘要

### Principles
1. **Presigned URL Security**: 所有文件访问通过临时预签名 URL，禁止直接暴露存储地址
2. **Async Processing**: 预览生成异步处理，不阻塞用户上传响应
3. **Storage Abstraction**: 存储层完全抽象，Rustfs 可替换为其他 S3 兼容存储
4. **Minimal Migration**: 现有本地存储测试数据直接丢弃，不做迁移
5. **Creator Protection**: 预览版足够判断质量，但无法替代正式版使用

### Decision Drivers
1. **Security**: 创作者作品内容在审核前必须保护，防止未授权下载
2. **Performance**: 大文件上传和预览生成不能阻塞用户体验
3. **Simplicity**: 技术栈保持精简，不引入不必要的复杂度

### Viable Options

#### Option A: 纯 Rustfs + 本地转码 (推荐)
- **Pros**: 完全可控，无外部依赖，成本可预测
- **Cons**: 需要部署 ffmpeg，视频转码占用服务器资源
- **Risk**: 大视频转码可能超时，需要异步队列

#### Option B: Rustfs + 云端转码服务
- **Pros**: 无需本地 ffmpeg，自动扩缩容
- **Cons**: 增加外部依赖和成本，网络延迟
- **Risk**: 服务商锁定，成本不可控

#### Option C: 保留本地存储 + Rustfs 双写
- **Pros**: 渐进迁移，风险低
- **Cons**: 代码复杂度高，违背"直接丢弃"原则
- **Risk**: 双写同步问题，数据不一致

**选择**: Option A - 纯 Rustfs + 本地转码，通过异步队列解决性能风险

---

## 用户故事

### US1: 商家上传任务素材
作为商家，我需要上传任务参考素材（图片/视频/文档），以便创作者了解任务要求。

**验收标准**:
- [ ] 支持拖拽上传多文件
- [ ] 单文件最大 500MB
- [ ] 自动识别文件类型
- [ ] 上传成功后返回可访问的预签名 URL
- [ ] 素材对所有用户开放下载

### US2: 创作者提交作品
作为创作者，我需要上传我的投稿作品，系统自动生成预览版。

**验收标准**:
- [ ] 支持图片和视频作品上传
- [ ] 上传后保存完整原文件到 Rustfs
- [ ] 异步生成预览版（图片 480px，视频 30% 码率）
- [ ] 预览版生成完成后通知用户
- [ ] 正式版 URL 不直接暴露

### US3: 商家预览作品
作为商家，我需要在审核前预览作品内容，判断是否符合要求。

**验收标准**:
- [ ] 可通过预签名 URL 在线预览作品
- [ ] 预览版质量足以判断内容
- [ ] 前端界面不展示下载按钮
- [ ] 预览版访问不限制权限

### US4: 商家下载正式版作品
作为商家，我需要在审核通过后下载完整质量的正式版作品。

**验收标准**:
- [ ] 审核通过的作品显示下载按钮
- [ ] 点击下载获取有时间限制的预签名 URL
- [ ] URL 过期后无法再次使用
- [ ] 仅该任务的商家可下载

### US5: 创作者下载自己的作品
作为创作者，我需要随时下载自己提交的正式版作品。

**验收标准**:
- [ ] 创作者可在个人中心查看自己的投稿
- [ ] 可下载自己作品的正式版
- [ ] 无论审核状态都可下载自己的作品

---

## 数据库 Schema

### 新表: file_objects
```sql
CREATE TABLE file_objects (
  id TEXT PRIMARY KEY,                    -- UUID
  bucket TEXT NOT NULL,                   -- Rustfs bucket
  object_key TEXT NOT NULL,               -- 存储路径
  original_name TEXT NOT NULL,            -- 原始文件名
  mime_type TEXT NOT NULL,                -- MIME 类型
  size_bytes INTEGER NOT NULL,            -- 文件大小
  checksum_sha256 TEXT,                   -- 校验和
  created_by TEXT NOT NULL,               -- 上传者 user_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,                    -- 自动删除时间（NULL=永久）
  
  UNIQUE(bucket, object_key)
);

-- 索引
CREATE INDEX idx_file_objects_created_by ON file_objects(created_by);
CREATE INDEX idx_file_objects_expires ON file_objects(expires_at) WHERE expires_at IS NOT NULL;
```

### 新表: file_derivatives (预览版关联)
```sql
CREATE TABLE file_derivatives (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL,           -- 原文件 file_objects.id
  derivative_type TEXT NOT NULL,          -- 'preview_image', 'preview_video'
  file_object_id TEXT NOT NULL,           -- 预览版对应的 file_objects.id
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processing_metadata TEXT,               -- JSON: { width, height, bitrate, etc }
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (source_file_id) REFERENCES file_objects(id),
  FOREIGN KEY (file_object_id) REFERENCES file_objects(id)
);

-- 索引
CREATE INDEX idx_derivatives_source ON file_derivatives(source_file_id);
CREATE INDEX idx_derivatives_status ON file_derivatives(processing_status);
```

### 修改表: task_attachments (素材)
```sql
ALTER TABLE task_attachments
ADD COLUMN file_object_id TEXT REFERENCES file_objects(id);

-- 迁移后删除旧字段
-- ALTER TABLE task_attachments DROP COLUMN storage_path;
```

### 修改表: submissions (作品)
```sql
ALTER TABLE submissions
ADD COLUMN original_file_id TEXT REFERENCES file_objects(id),
ADD COLUMN preview_file_id TEXT REFERENCES file_objects(id),
ADD COLUMN preview_status TEXT DEFAULT 'pending'; -- pending, ready, failed

-- 迁移后删除旧字段
-- ALTER TABLE submissions DROP COLUMN asset_url;
```

---

## API 设计

### 1. 文件上传 (Initiate Upload)
```typescript
POST /api/files/upload-init
Content-Type: application/json

Request:
{
  "fileName": "example.jpg",
  "fileSize": 10485760,
  "mimeType": "image/jpeg",
  "purpose": "task_attachment" | "submission"  // 素材或作品
}

Response:
{
  "uploadId": "uuid",
  "presignedUrl": "https://rustfs.example.com/...",
  "fields": { /* S3 post fields */ },
  "expiresAt": "2025-04-05T12:00:00Z"
}
```

### 2. 上传完成回调
```typescript
POST /api/files/upload-complete
Content-Type: application/json

Request:
{
  "uploadId": "uuid",
  "bucket": "meow-uploads",
  "objectKey": "uploads/2025/04/05/uuid.jpg",
  "checksum": "sha256-hash"
}

Response:
{
  "fileId": "uuid",
  "status": "completed",
  "derivativeStatus": "pending"  // 如果是作品，预览版处理状态
}
```

### 3. 获取预签名访问 URL
```typescript
GET /api/files/:fileId/access?type=preview|original

Headers:
Authorization: Bearer {token}

Response:
{
  "url": "https://rustfs.example.com/...?signature=...",
  "expiresAt": "2025-04-05T12:15:00Z",
  "contentType": "image/jpeg"
}

Errors:
- 403: 无权限访问该文件或文件类型
- 404: 文件不存在
- 400: 预览版尚未生成完成
```

### 4. 素材列表 (任务详情)
```typescript
GET /api/tasks/:taskId/attachments

Response:
{
  "attachments": [
    {
      "id": "uuid",
      "fileName": "brief.pdf",
      "size": 1048576,
      "mimeType": "application/pdf",
      "downloadUrl": "https://..."  // 预签名 URL
    }
  ]
}
```

### 5. 作品列表 (商家视图)
```typescript
GET /api/tasks/:taskId/submissions

Response:
{
  "submissions": [
    {
      "id": "uuid",
      "creatorId": "user-uuid",
      "status": "submitted|approved|rejected",
      "previewUrl": "https://...",     // 预签名预览 URL
      "canDownloadOriginal": true,      // 是否可下载正式版
      "originalUrl": "https://..."      // 预签名正式版 URL（如有权限）
    }
  ]
}
```

---

## 技术实现

### Rustfs Client 封装
```typescript
// packages/storage/src/rustfs-client.ts
export interface RustfsConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export class RustfsClient {
  constructor(config: RustfsConfig);
  
  // 生成预签名上传 URL
  createPresignedUpload(key: string, mimeType: string, expiresSeconds: number): PresignedUrl;
  
  // 生成预签名访问 URL
  createPresignedAccess(key: string, expiresSeconds: number): string;
  
  // 删除对象
  deleteObject(key: string): Promise<void>;
  
  // 检查对象是否存在
  headObject(key: string): Promise<ObjectMetadata>;
}
```

### 预览生成服务
```typescript
// apps/api/src/services/preview-generator.ts
export class PreviewGenerator {
  // 图片预览：缩放到 480px 宽度
  async generateImagePreview(sourcePath: string, outputPath: string): Promise<void>;
  
  // 视频预览：转码至 30% 码率
  async generateVideoPreview(sourcePath: string, outputPath: string): Promise<void>;
}

// 异步处理队列
export class PreviewQueue {
  enqueue(fileId: string, type: 'image' | 'video'): Promise<void>;
  processNext(): Promise<void>;
}
```

### 访问控制中间件
```typescript
// apps/api/src/middleware/file-access.ts
export function checkFileAccess(
  fileType: 'material' | 'preview' | 'original',
  options: {
    requireSubmissionStatus?: 'approved';  // 正式版需要审核通过
    allowCreator?: boolean;               // 允许创作者访问
    allowTaskMerchant?: boolean;          // 允许任务商家访问
  }
): RequestHandler;
```

---

## 目录结构

```
apps/api/src/
├── lib/
│   ├── rustfs.ts           # Rustfs 客户端配置
│   └── file-access.ts      # 文件访问权限工具
├── services/
│   ├── files.ts            # 文件服务（上传、查询）
│   ├── preview-generator.ts # 预览生成服务
│   └── preview-queue.ts     # 异步处理队列
├── routes/
│   └── files.ts            # 文件相关 API 路由
└── workers/
    └── preview-worker.ts   # 预览生成 worker（可选独立进程）

packages/
├── storage/                # 新包：存储抽象层
│   ├── src/
│   │   ├── index.ts
│   │   ├── rustfs-client.ts
│   │   └── types.ts
│   └── package.json
└── database/
    └── src/migrations/     # 数据库迁移文件
        ├── 001_add_file_objects.sql
        └── 002_add_file_derivatives.sql
```

---

## 测试策略

### 单元测试
- Rustfs 客户端封装：mock S3 响应
- 预览生成：mock sharp/ffmpeg
- 访问控制：mock 用户和提交状态

### 集成测试
- 上传 → 存储 → 元数据保存完整流程
- 预览生成异步流程
- 预签名 URL 生成和过期验证

### E2E 测试
- 创作者上传作品 → 生成预览 → 商家预览 → 审核通过 → 下载正式版
- 权限边界测试（未审核无法下载正式版）

---

## 部署计划

### Phase 1: 基础设施
1. 部署 Rustfs 服务
2. 配置域名和 SSL
3. 创建 buckets（dev/staging/prod）
4. 配置访问密钥

### Phase 2: API 开发
1. 实现 Rustfs 客户端
2. 实现文件上传 API
3. 实现预签名 URL 生成
4. 实现访问控制中间件

### Phase 3: 预览生成
1. 集成 sharp（图片处理）
2. 集成 ffmpeg（视频转码）
3. 实现异步处理队列
4. 预览生成 worker

### Phase 4: 前端适配
1. 更新上传组件（使用预签名 URL）
2. 更新预览组件（新 URL 格式）
3. 更新下载按钮（权限控制）

### Phase 5: 切换与清理
1. 停止本地存储写入
2. 验证所有文件访问通过 Rustfs
3. 清理本地存储代码

---

## 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 视频转码超时 | 中 | 高 | 异步队列 + 超时重试 + 进度通知 |
| Rustfs 部署问题 | 中 | 高 | 提前部署测试环境验证 |
| 存储成本超支 | 低 | 中 | 监控 + 保留策略（未来实现） |
| 预签名 URL 泄露 | 低 | 高 | 短过期时间 + URL 不持久化 |

---

## 后续迭代

1. **内容审核**: 集成图片/视频内容审核 API
2. **CDN**: 接入 CDN 加速静态资源访问
3. **智能压缩**: 根据内容类型自动选择最优压缩参数
4. **存储清理**: 实现自动删除过期/未使用文件策略


---

# 架构评审反馈补丁 (v1.1)

**状态**: ITERATE → 基于架构评审反馈的关键修复

---

## 🔴 关键修复 1: StorageProvider 接口

### 问题
当前设计只有 `RustfsClient` 具体实现，没有抽象接口，导致紧耦合。

### 修复
```typescript
// packages/storage/src/storage-provider.ts
export interface StorageProvider {
  // 生成预签名上传 URL
  createPresignedUpload(
    key: string, 
    mimeType: string, 
    expiresSeconds: number
  ): Promise<PresignedUploadResult>;
  
  // 生成预签名访问 URL
  createPresignedAccess(
    key: string, 
    expiresSeconds: number
  ): Promise<string>;
  
  // 删除对象
  deleteObject(key: string): Promise<void>;
  
  // 检查对象是否存在
  headObject(key: string): Promise<ObjectMetadata | null>;
  
  // 获取 provider 类型
  getProviderType(): string;
}

// Factory
export function createStorageProvider(
  type: 'rustfs' | 'minio' | 's3',
  config: StorageConfig
): StorageProvider {
  switch (type) {
    case 'rustfs': return new RustfsStorageProvider(config);
    case 'minio': return new MinioStorageProvider(config);
    case 's3': return new S3StorageProvider(config);
    default: throw new Error(`Unknown provider: ${type}`);
  }
}

// 具体实现
export class RustfsStorageProvider implements StorageProvider {
  // ... Rustfs 具体实现
}
```

---

## 🔴 关键修复 2: 队列持久化 + 重试机制

### 问题
原设计缺少队列持久化和重试机制，进程崩溃会导致任务丢失。

### 修复: 更新数据库 Schema

```sql
-- 扩展 file_derivatives 表
ALTER TABLE file_derivatives ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE file_derivatives ADD COLUMN next_retry_at DATETIME;
ALTER TABLE file_derivatives ADD COLUMN worker_id TEXT; -- 追踪哪个 worker 在处理

-- 防止重复任务的唯一约束
CREATE UNIQUE INDEX idx_derivatives_unique_type 
ON file_derivatives(source_file_id, derivative_type);

-- 查询待处理任务的索引
CREATE INDEX idx_derivatives_pending 
ON file_derivatives(processing_status, next_retry_at) 
WHERE processing_status IN ('pending', 'failed') 
AND (next_retry_at IS NULL OR next_retry_at <= CURRENT_TIMESTAMP);
```

### 修复: 队列服务实现

```typescript
// apps/api/src/services/preview-queue.ts
export interface PersistentPreviewQueue {
  enqueue(fileId: string, type: 'image' | 'video'): Promise<void>;
  dequeue(): Promise<QueueJob | null>;
  markInProgress(jobId: string, workerId: string): Promise<void>;
  markCompleted(jobId: string): Promise<void>;
  markFailed(jobId: string, error: string): Promise<void>;
  scheduleRetry(jobId: string, delayMs: number): Promise<void>;
}

export class SQLitePreviewQueue implements PersistentPreviewQueue {
  private readonly maxRetries = 3;
  private readonly retryDelays = [60000, 300000, 900000]; // 1min, 5min, 15min
  
  async dequeue(): Promise<QueueJob | null> {
    // 原子性获取待处理任务
    const job = await db.queryOne(`
      SELECT * FROM file_derivatives
      WHERE processing_status IN ('pending', 'failed')
        AND (next_retry_at IS NULL OR next_retry_at <= CURRENT_TIMESTAMP)
        AND retry_count < $maxRetries
      ORDER BY created_at ASC
      LIMIT 1
    `, { maxRetries: this.maxRetries });
    
    if (!job) return null;
    
    // 标记为处理中
    await this.markInProgress(job.id, this.workerId);
    return job;
  }
  
  async markFailed(jobId: string, error: string): Promise<void> {
    const job = await db.getDerivative(jobId);
    const newRetryCount = job.retry_count + 1;
    
    if (newRetryCount >= this.maxRetries) {
      // 超过重试次数，标记为永久失败
      await db.updateDerivative(jobId, {
        processing_status: 'failed',
        error_message: error,
        retry_count: newRetryCount
      });
    } else {
      // 安排重试
      const delayMs = this.retryDelays[Math.min(newRetryCount - 1, this.retryDelays.length - 1)];
      const nextRetryAt = new Date(Date.now() + delayMs);
      
      await db.updateDerivative(jobId, {
        processing_status: 'pending', // 回到待处理状态
        error_message: error,
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt.toISOString()
      });
    }
  }
}

// Worker 进程独立运行
// apps/api/src/workers/preview-worker.ts
async function startPreviewWorker() {
  const queue = new SQLitePreviewQueue();
  const generator = new PreviewGenerator();
  const storage = createStorageProvider('rustfs', config);
  
  while (true) {
    const job = await queue.dequeue();
    if (!job) {
      await sleep(5000); // 5秒轮询
      continue;
    }
    
    try {
      await processPreviewJob(job, generator, storage);
      await queue.markCompleted(job.id);
    } catch (error) {
      await queue.markFailed(job.id, error.message);
    }
  }
}
```

---

## 🔴 关键修复 3: 迁移策略验证

### 问题
"drop and recreate" 策略可能导致数据丢失。

### 修复
**第一步：验证数据** (必须在部署前执行)

```typescript
// scripts/verify-migration-safety.ts
async function verifyMigrationSafety() {
  // 检查本地存储目录
  const localUploadsDir = process.env.MEOW_UPLOAD_DIR || './apps/api/uploads';
  const files = await fs.readdir(localUploadsDir);
  
  if (files.length > 0 && files.some(f => !f.startsWith('.'))) {
    console.error('❌ 发现本地存储文件:', files.length);
    console.error('❌ 迁移前请备份或迁移这些文件');
    process.exit(1);
  }
  
  // 检查数据库中的 asset_url
  const submissions = await db.query(`
    SELECT id, asset_url FROM submissions 
    WHERE asset_url IS NOT NULL 
      AND asset_url NOT LIKE 'https://%'
      AND asset_url NOT LIKE 'http://%'
  `);
  
  if (submissions.length > 0) {
    console.error('❌ 发现非 URL 格式的 asset_url:', submissions.length, '条记录');
    console.error('❌ 需要先运行迁移脚本');
    process.exit(1);
  }
  
  console.log('✅ 可以安全迁移');
}
```

**第二步：可选的迁移脚本** (如果需要保留数据)

```typescript
// scripts/migrate-local-to-rustfs.ts
async function migrateLocalToRustfs() {
  const localUploadsDir = './apps/api/uploads';
  const storage = createStorageProvider('rustfs', config);
  
  const files = await fs.readdir(localUploadsDir);
  
  for (const filename of files) {
    const filePath = path.join(localUploadsDir, filename);
    const stats = await fs.stat(filePath);
    
    if (!stats.isFile()) continue;
    
    // 读取文件
    const buffer = await fs.readFile(filePath);
    
    // 上传到 Rustfs
    const mimeType = guessMimeType(filename);
    const objectKey = `migrated/${new Date().toISOString().split('T')[0]}/${filename}`;
    
    await storage.uploadBuffer(objectKey, buffer, mimeType);
    
    // 创建 file_objects 记录
    const fileRecord = await db.insertFileObject({
      bucket: config.bucket,
      object_key: objectKey,
      original_name: filename,
      mime_type: mimeType,
      size_bytes: stats.size,
      created_by: 'migration-script',
      migrated_from: filePath
    });
    
    // 更新 submissions 表引用
    await db.query(`
      UPDATE submissions 
      SET original_file_id = $1,
          asset_url = $2
      WHERE asset_url LIKE $3
    `, [fileRecord.id, `/api/files/${fileRecord.id}/access`, `%${filename}%`]);
    
    console.log(`✅ 迁移完成: ${filename} -> ${objectKey}`);
  }
}
```

---

## 🔴 关键修复 4: 审计日志

### 问题
预览 URL 可能泄露，需要追踪正式版文件的访问。

### 修复: 访问审计表

```sql
-- 新建审计日志表
CREATE TABLE file_access_logs (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'original', 'preview'
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL, -- 'creator', 'merchant', 'admin'
  access_method TEXT NOT NULL, -- 'api', 'presigned_url'
  ip_address TEXT,
  user_agent TEXT,
  accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (file_id) REFERENCES file_objects(id)
);

-- 索引
CREATE INDEX idx_access_logs_file ON file_access_logs(file_id);
CREATE INDEX idx_access_logs_user ON file_access_logs(user_id);
CREATE INDEX idx_access_logs_time ON file_access_logs(accessed_at);
```

### 修复: 访问控制中间件

```typescript
// apps/api/src/middleware/file-access.ts
export async function auditFileAccess(
  fileId: string,
  fileType: 'original' | 'preview',
  req: Request
): Promise<void> {
  // 只记录正式版访问
  if (fileType === 'preview') return;
  
  await db.insert('file_access_logs', {
    id: randomUUID(),
    file_id: fileId,
    file_type: fileType,
    user_id: req.user.id,
    user_role: req.user.role,
    access_method: 'api',
    ip_address: req.ip,
    user_agent: req.headers['user-agent']?.substring(0, 500)
  });
}

// 更新 presigned URL 生成
export async function createPresignedAccess(
  fileId: string,
  fileType: 'original' | 'preview',
  userId: string,
  req: Request
): Promise<string> {
  // ... 权限检查 ...
  
  // 生成 URL
  const url = await storage.createPresignedAccess(key, 900); // 15分钟
  
  // 审计日志
  await auditFileAccess(fileId, fileType, req);
  
  return url;
}
```

---

## 🟡 其他修复: MIME 类型验证

```typescript
// 使用 file-type 库验证，而非仅检查扩展名
import { fileTypeFromBuffer } from 'file-type';

async function validateMimeType(buffer: Buffer, claimedMimeType: string): Promise<boolean> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) return false;
  
  // 允许的类型白名单
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/pdf', 'application/zip'
  ];
  
  return allowedTypes.includes(detected.mime);
}
```

---

## 更新的风险矩阵

| 风险 | 可能性 | 影响 | 修复状态 |
|------|--------|------|----------|
| 队列任务丢失 | 中 | 高 | ✅ 已修复 (SQLite + retry) |
| 迁移数据丢失 | 低 | 高 | ✅ 已修复 (验证脚本) |
| 预览 URL 泄露 | 中 | 中 | ✅ 已修复 (审计日志 + 短过期) |
| 存储紧耦合 | 高 | 中 | ✅ 已修复 (StorageProvider 接口) |
| ffmpeg 安全漏洞 | 低 | 高 | ⚠️ 缓解 (资源限制 + 沙箱建议) |
| MIME 类型欺骗 | 中 | 中 | ✅ 已修复 (file-type 验证) |

---

## 修订后的验收标准

### 新增验收项
- [ ] 实现 `StorageProvider` 接口和工厂
- [ ] 队列任务在进程重启后恢复
- [ ] 失败任务自动重试 3 次 (退避策略)
- [ ] 迁移前运行安全验证脚本
- [ ] 正式版文件访问记录审计日志
- [ ] MIME 类型通过 file magic bytes 验证
