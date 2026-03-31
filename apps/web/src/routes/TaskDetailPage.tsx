import type {
  CreatorSubmissionCardModel,
  CreatorTaskDetailModel
} from "../lib/models.js";

interface TaskDetailPageProps {
  task: CreatorTaskDetailModel | null;
  submissionCards: CreatorSubmissionCardModel[];
  feedbackMessage?: string;
  errorMessage?: string;
  onSubmitTap: () => void;
  onEditTap: (submissionId: string) => void;
  onWithdrawTap: (submissionId: string) => void;
}

export function TaskDetailPage({
  task,
  submissionCards,
  feedbackMessage,
  errorMessage,
  onSubmitTap,
  onEditTap,
  onWithdrawTap
}: TaskDetailPageProps) {
  if (!task) {
    return (
      <section className="content-section">
        <p className="empty-state">{errorMessage ?? "请先从任务池选择任务。"}</p>
      </section>
    );
  }

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">任务详情</h1>
          <p className="section-copy">原生创作者页：查看任务要求并准备投稿。</p>
        </div>
      </div>
      <article className="task-card">
        <h2 className="task-title">{task.title}</h2>
        <p className="task-meta">状态：{task.status}</p>
        <p className="task-meta">奖励：{task.rewardText}</p>
        <p className="task-meta">我的投稿：{task.creatorSubmissionCount}</p>
        {task.canSubmit ? (
          <button className="primary-button" type="button" onClick={onSubmitTap}>
            立即投稿
          </button>
        ) : (
          <p className="empty-state">当前任务不可投稿</p>
        )}
      </article>
      <article className="task-card">
        <h2 className="task-title">我的投稿</h2>
        {submissionCards.length > 0 ? (
          <div className="task-grid">
            {submissionCards.map((item) => (
              <article key={item.submissionId} className="task-card">
                <h3 className="task-title">{item.title}</h3>
                <p className="task-meta">状态：{item.statusText}</p>
                <div className="inline-actions">
                  <span className="pill">{item.rewardTag}</span>
                  {item.canEdit ? (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onEditTap(item.submissionId)}
                    >
                      修改
                    </button>
                  ) : null}
                  {item.canWithdraw ? (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onWithdrawTap(item.submissionId)}
                    >
                      撤回
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">还没有投稿记录</p>
        )}
      </article>
      {feedbackMessage ? <p className="status-message">{feedbackMessage}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </section>
  );
}
