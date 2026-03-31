import type { MerchantReviewCardModel } from "../lib/models.js";

interface MerchantReviewPageProps {
  task: {
    title: string;
    rewardText: string;
  } | null;
  cards: MerchantReviewCardModel[];
  feedbackMessage?: string;
  errorMessage?: string;
  actionPending?: boolean;
  onApprove: (submissionId: string) => void;
  onTip: (submissionId: string) => void;
  onRanking: (submissionId: string) => void;
}

export function MerchantReviewPage({
  task,
  cards,
  feedbackMessage,
  errorMessage,
  actionPending = false,
  onApprove,
  onTip,
  onRanking
}: MerchantReviewPageProps) {
  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <p className="section-title">稿件审核</p>
          <p className="section-copy">原生商家页：审核稿件、通过后冻结基础奖。</p>
        </div>
      </div>
      {task ? (
        <article className="task-card">
          <h2 className="task-title">{task.title}</h2>
          <p className="task-meta">{task.rewardText}</p>
        </article>
      ) : null}
      {cards.length > 0 ? (
        <div className="task-grid">
          {cards.map((item) => (
            <article key={item.submissionId} className="task-card">
              <h2 className="task-title">{item.creatorText}</h2>
              <p className="task-meta">{`${item.statusText} · ${item.rewardTag}`}</p>
              <div className="inline-actions">
                {item.canApprove ? (
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={actionPending}
                    onClick={() => onApprove(item.submissionId)}
                  >
                    通过
                  </button>
                ) : null}
                {item.canTip ? (
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={actionPending}
                    onClick={() => onTip(item.submissionId)}
                  >
                    打赏
                  </button>
                ) : null}
                {item.canRanking ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={actionPending}
                    onClick={() => onRanking(item.submissionId)}
                  >
                    排名奖
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">还没有投稿，请先在创作者身份下提交作品。</p>
      )}
      {feedbackMessage ? <p className="status-message">{feedbackMessage}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </section>
  );
}
