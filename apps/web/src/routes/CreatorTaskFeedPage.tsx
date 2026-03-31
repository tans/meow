import type { CreatorSubmissionCardModel } from "../lib/models.js";

interface CreatorTaskFeedPageProps {
  cards: CreatorSubmissionCardModel[];
  errorMessage?: string;
  onTaskTap: (taskId: string) => void;
}

export function CreatorTaskFeedPage({
  cards,
  errorMessage,
  onTaskTap
}: CreatorTaskFeedPageProps) {
  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">我的投稿</h1>
          <p className="section-copy">原生创作者页：查看所有投稿记录与状态。</p>
        </div>
      </div>
      {cards.length > 0 ? (
        <div className="task-grid">
          {cards.map((item) => (
            <article key={item.submissionId} className="task-card">
              <h2 className="task-title">{item.title}</h2>
              <p className="task-meta">状态：{item.statusText}</p>
              <p className="task-detail">奖励：{item.rewardTag}</p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onTaskTap(item.taskId)}
              >
                查看任务
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">{errorMessage ?? "还没有投稿记录"}</p>
      )}
    </section>
  );
}
