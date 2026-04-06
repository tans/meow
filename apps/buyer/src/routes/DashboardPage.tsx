interface BuyerTaskSummary {
  status: "draft" | "published" | "paused" | "ended" | "settled" | "closed";
  submissionCount: number;
}

interface BuyerWalletSummary {
  escrowAmount: number;
}

export function DashboardPage({
  tasks,
  wallet,
  onGotoTasks,
}: {
  tasks: BuyerTaskSummary[];
  wallet: BuyerWalletSummary | null;
  onGotoTasks: () => void;
}) {
  const published = tasks.filter((task) => task.status === "published").length;
  const draft = tasks.filter((task) => task.status === "draft").length;
  const settled = tasks.filter((task) => task.status === "settled").length;
  const submissionCount = tasks.reduce((sum, item) => sum + item.submissionCount, 0);

  return (
    <section className="page-grid">
      <article className="hero-card stack">
        <div>
          <p className="card-kicker">今日概览</p>
          <h3>任务发布与审核节奏</h3>
        </div>
        <p>
          当前共管理 <strong>{tasks.length}</strong> 个任务，累计收到 <strong>{submissionCount}</strong>
          条投稿。可在需求管理中继续发布新任务或处理待审核稿件。
        </p>
        <div>
          <button type="button" className="primary-button" onClick={onGotoTasks}>
            前往需求管理
          </button>
        </div>
      </article>

      <div className="metric-grid">
        <article className="panel metric-card">
          <p className="card-kicker">草稿任务</p>
          <strong>{draft}</strong>
          <span>可继续完善并发布</span>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">发布中任务</p>
          <strong>{published}</strong>
          <span>持续接收投稿</span>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">已结算任务</p>
          <strong>{settled}</strong>
          <span>奖励与退款已处理</span>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">托管资金</p>
          <strong>{wallet ? `¥${wallet.escrowAmount}` : "-"}</strong>
          <span>资金中心可查看明细</span>
        </article>
      </div>
    </section>
  );
}
