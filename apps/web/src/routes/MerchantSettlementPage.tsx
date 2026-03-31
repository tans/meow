import type { MerchantSettlementModel } from "../lib/models.js";

interface MerchantSettlementPageProps {
  settlement: MerchantSettlementModel | null;
  resultMessage?: string;
  errorMessage?: string;
  settling?: boolean;
  onSettle: () => void;
}

export function MerchantSettlementPage({
  settlement,
  resultMessage,
  errorMessage,
  settling = false,
  onSettle
}: MerchantSettlementPageProps) {
  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <p className="section-title">需求结算</p>
          <p className="section-copy">释放奖励并退回未使用预算。</p>
        </div>
      </div>
      {settlement ? (
        <article className="task-card">
          <h2 className="task-title">{settlement.title}</h2>
          <p className="task-meta">{`投稿 ${settlement.submittedCount} · 通过 ${settlement.approvedCount}`}</p>
          {settlement.rewardPreview.map((item) => (
            <p key={item} className="pill">
              {item}
            </p>
          ))}
          <button
            className="primary-button"
            type="button"
            disabled={settling}
            onClick={onSettle}
          >
            执行结算
          </button>
        </article>
      ) : (
        <p className="empty-state">暂无待结算任务</p>
      )}
      {resultMessage ? <p className="status-message">{resultMessage}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </section>
  );
}
