# Context Snapshot: storage-material-work-management

## Task Statement
为小程序和 Web 端构建统一的素材与作品管理功能，底层使用 Rustfs 作为存储。

## Desired Outcome
- 用户可上传素材
- 用户可查看素材和作品
- 作品分为预览版本和正式版本
- 正式版本只有通过审核后才能查看和下载

## Stated Solution
基于 Rustfs 构建存储层，实现素材和作品的上传、查看、访问控制功能。

## Probable Intent Hypothesis
用户需要一个可扩展的、类似 S3 的存储方案来替代当前的本地文件系统存储，
同时需要更细粒度的作品访问控制（审核机制）。

## Known Facts/Evidence
- 当前使用本地文件系统存储上传文件 (apps/api/src/lib/uploads.ts)
- 作品(Submission)模型已有 assetUrl 字段
- 素材(TaskAttachment)支持图片/视频
- 使用 SQLite 数据库，无 Rustfs 集成
- 小程序端: apps/wechat-miniapp
- Web端: apps/web
- 管理后台: apps/admin

## Constraints
- 基于 Rustfs 作为底层存储 (S3 兼容 API)
- 作品有审核状态控制访问权限

## Unknowns/Open Questions
1. Rustfs 部署方式？本地还是远程集群？
2. "素材"和"作品"的具体定义和区别？
3. 预览版本和正式版本的存储策略？
4. 审核流程的具体状态机？
5. 访问控制的粒度？URL 级还是 API 级？
6. 小程序和 Web 端是否有不同的权限需求？

## Decision-Boundary Unknowns
- 是否需要保留本地存储作为 fallback？
- 是否需要 CDN 加速？
- 文件大小/类型限制由谁决定？
- 删除策略（物理删除 vs 软删除）？
