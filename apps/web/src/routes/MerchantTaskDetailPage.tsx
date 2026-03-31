import type { MerchantTaskDetailModel } from "../lib/models.js";

interface MerchantTaskDetailPageProps {
  task: MerchantTaskDetailModel | null;
  errorMessage?: string;
  onOpenReview?: () => void;
  onOpenSettlement?: () => void;
}

export function MerchantTaskDetailPage({
  task,
  errorMessage,
  onOpenReview,
  onOpenSettlement
}: MerchantTaskDetailPageProps) {
  const attachments = task?.assetAttachments ?? [];

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <p className="section-title">需求详情</p>
          <p className="section-copy">查看需求状态、投稿进度和已上传素材。</p>
        </div>
      </div>
      {task ? (
        <article className="task-card">
          <h2 className="task-title">{task.title}</h2>
          <p className="task-meta">状态：{task.statusText}</p>
          <p className="task-meta">奖励：{task.rewardText}</p>
          <p className="task-meta">投稿数：{task.submissionCount}</p>
          <p className="pill">{`锁定预算 ${task.lockedBudgetText}`}</p>
          {attachments.length > 0 ? (
            <div className="attachment-gallery">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="attachment-preview">
                  {attachment.kind === "image" ? (
                    <img
                      className="attachment-preview__image"
                      src={attachment.url}
                      alt={attachment.fileName}
                    />
                  ) : (
                    <video
                      className="attachment-preview__video"
                      src={attachment.url}
                      controls
                    />
                  )}
                  <p className="task-detail">{attachment.fileName}</p>
                </div>
              ))}
            </div>
          ) : null}
          {task.rewardTags.length > 0 ? (
            <p className="task-detail">{`已发奖励：${task.rewardTags.join("/")}`}</p>
          ) : null}
          <div className="inline-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onOpenReview}
            >
              前往审核
            </button>
            <button className="primary-button" type="button" onClick={onOpenSettlement}>
              前往结算
            </button>
          </div>
        </article>
      ) : errorMessage ? (
        <p className="empty-state">{errorMessage}</p>
      ) : (
        <p className="empty-state">还没有需求，请先在发布需求页创建并发布。</p>
      )}
    </section>
  );
}
