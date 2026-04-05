# Test Spec: Rustfs 存储系统

## 测试覆盖矩阵

| 功能 | 单元测试 | 集成测试 | E2E 测试 | 备注 |
|------|---------|---------|---------|------|
| 文件上传 | ✅ | ✅ | ✅ | 包括大文件分片 |
| 预签名 URL 生成 | ✅ | ✅ | ✅ | 验证过期时间 |
| 预签名 URL 访问 | ✅ | ✅ | ✅ | 验证权限控制 |
| 图片预览生成 | ✅ | ✅ | ✅ | 480px 宽度验证 |
| 视频预览生成 | ⬜ | ✅ | ✅ | ffmpeg 依赖，CI 复杂 |
| 访问控制 | ✅ | ✅ | ✅ | 不同角色权限 |
| 数据库迁移 | ⬜ | ✅ | ⬜ | 数据完整性验证 |

---

## 单元测试

### Rustfs Client
```typescript
// packages/storage/src/rustfs-client.test.ts
describe('RustfsClient', () => {
  describe('createPresignedUpload', () => {
    it('should generate valid presigned upload URL', () => {
      // 验证 URL 包含必要参数
      // 验证过期时间计算正确
    });
    
    it('should include correct content-type', () => {
      // 验证 MIME type 传递
    });
  });
  
  describe('createPresignedAccess', () => {
    it('should generate readable URL', async () => {
      // mock S3 响应
      // 验证 URL 可访问性
    });
    
    it('should respect expiration time', () => {
      // 验证过期参数
    });
  });
  
  describe('deleteObject', () => {
    it('should delete object successfully', async () => {
      // mock S3 delete
      // 验证删除成功
    });
  });
});
```

### 文件服务
```typescript
// apps/api/src/services/files.test.ts
describe('FileService', () => {
  describe('initiateUpload', () => {
    it('should reject files larger than 500MB', async () => {
      // 验证 413 错误
    });
    
    it('should accept valid image files', async () => {
      // 验证成功响应
    });
    
    it('should accept valid video files', async () => {
      // 验证成功响应
    });
    
    it('should reject unsupported file types', async () => {
      // 验证 400 错误
    });
  });
  
  describe('completeUpload', () => {
    it('should save file metadata to database', async () => {
      // 验证数据库记录
    });
    
    it('should queue preview generation for submissions', async () => {
      // 验证队列任务
    });
    
    it('should not queue preview for task attachments', async () => {
      // 验证素材不生成预览
    });
  });
});
```

### 访问控制
```typescript
// apps/api/src/middleware/file-access.test.ts
describe('FileAccessMiddleware', () => {
  describe('preview access', () => {
    it('should allow anyone to access preview', async () => {
      // 无认证用户也可访问
    });
  });
  
  describe('original access', () => {
    it('should allow creator to download own work', async () => {
      // 创作者可下载
    });
    
    it('should allow merchant to download approved submission', async () => {
      // 商家可下载已通过审核作品
    });
    
    it('should reject merchant for unapproved submission', async () => {
      // 未审核作品商家不可下载
    });
    
    it('should reject other creators', async () => {
      // 其他创作者不可下载
    });
  });
});
```

### 预览生成器（mock）
```typescript
// apps/api/src/services/preview-generator.test.ts
describe('PreviewGenerator', () => {
  describe('generateImagePreview', () => {
    it('should resize image to 480px width', async () => {
      // mock sharp
      // 验证 resize(480) 调用
    });
    
    it('should maintain aspect ratio', async () => {
      // 验证等比缩放
    });
  });
  
  describe('generateVideoPreview', () => {
    it('should transcode to 30% bitrate', async () => {
      // mock ffmpeg
      // 验证 -b:v 参数为原码率 30%
    });
  });
});
```

---

## 集成测试

### 上传流程
```typescript
// apps/api/src/tests/upload-integration.test.ts
describe('Upload Integration', () => {
  it('should complete full upload flow', async () => {
    // 1. 调用 upload-init 获取预签名 URL
    // 2. 使用预签名 URL 上传文件到 Rustfs
    // 3. 调用 upload-complete 通知服务器
    // 4. 验证数据库记录
    // 5. 验证可访问性
  });
  
  it('should handle upload with preview generation', async () => {
    // 1. 上传作品
    // 2. 验证预览版生成任务入队
    // 3. 模拟预览生成完成
    // 4. 验证预览版可访问
  });
});
```

### 访问控制集成
```typescript
// apps/api/src/tests/access-integration.test.ts
describe('Access Control Integration', () => {
  it('should enforce submission status for download', async () => {
    // 1. 创建作品，状态为 submitted
    // 2. 商家尝试下载正式版 → 403
    // 3. 更新状态为 approved
    // 4. 商家下载成功
  });
});
```

---

## E2E 测试

### 完整用户流程
```typescript
// e2e/storage-workflow.test.ts
describe('Storage E2E Workflow', () => {
  it('should complete creator submission workflow', async () => {
    // 1. 商家创建任务并上传素材
    // 2. 验证素材可下载
    
    // 3. 创作者提交作品
    // 4. 验证预览版生成
    // 5. 验证创作者可预览
    
    // 6. 商家预览作品（无下载按钮）
    // 7. 商家审核通过
    // 8. 验证商家可下载正式版
    // 9. 验证创作者可下载正式版
  });
  
  it('should prevent unauthorized downloads', async () => {
    // 1. 创作者 A 提交作品
    // 2. 创作者 B 尝试下载 → 403
    // 3. 其他商家尝试下载 → 403
  });
});
```

---

## 性能测试

### 预览生成性能
- 目标：500MB 视频在 30 秒内完成转码
- 测试场景：
  - 100MB 视频（1080p）
  - 500MB 视频（4K）
  - 并发 5 个视频转码

### 预签名 URL 生成性能
- 目标：< 100ms
- 测试场景：
  - 单文件请求
  - 批量 100 个文件请求

---

## 验收测试清单

### 功能验收
- [ ] 商家可以上传素材文件（图片/视频/文档）
- [ ] 上传的素材可以通过预签名 URL 访问和下载
- [ ] 创作者可以上传作品文件
- [ ] 上传后自动生成预览版：
  - [ ] 图片：宽度 480px，保持比例
  - [ ] 视频：码率为原始的 30%，保持格式
- [ ] 预览版可通过预签名 URL 在线播放/查看
- [ ] 作品审核通过前，正式版不可下载（返回 403）
- [ ] 作品审核通过后，商家可通过预签名 URL 下载正式版
- [ ] 作品审核通过后，创作者可通过预签名 URL 下载正式版
- [ ] 前端预览组件仅显示预览版，不显示正式版下载按钮（审核前）

### 技术验收
- [ ] 所有文件存储在 Rustfs，本地无残留
- [ ] 预签名 URL 包含正确的 Content-Type
- [ ] 预签名 URL 在设定时间后过期
- [ ] 超过 500MB 的上传返回 413 Payload Too Large
- [ ] 不支持的文件类型返回 400 Bad Request

### 性能验收
- [ ] 预览版生成在 30 秒内完成（500MB 视频）
- [ ] 预签名 URL 生成响应时间 < 100ms

