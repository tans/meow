import type { TaskDetail } from "../lib/api.js";

interface TaskDetailPageProps {
  task?: TaskDetail | null;
  onBack?: () => void;
  onResume?: (taskId: string) => void;
  loading?: boolean;
  busy?: boolean;
}

export function TaskDetailPage({
  task = null,
  onBack = () => undefined,
  onResume = () => undefined,
  loading = false,
  busy = false
}: TaskDetailPageProps) {
  if (loading || !task) {
    return (
      <section className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">任务详情</p>
            <h3>加载中...</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onBack}>
            返回任务列表
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">{task.id}</p>
            <h3>{task.title}</h3>
          </div>
          <div className="task-actions">
            {task.status === "paused" ? (
              <button
                type="button"
                className="ghost-button"
                disabled={busy}
                onClick={() => onResume(task.id)}
              >
                恢复任务
              </button>
            ) : null}
            <button type="button" className="ghost-button" onClick={onBack}>
              返回任务列表
            </button>
          </div>
        </div>
        <p>
          商家 {task.merchantId} · 状态 {task.status} · 托管 {task.lockedBudget}
        </p>
      </div>

      <div className="metric-grid">
        <article className="panel metric-card">
          <p className="card-kicker">总投稿</p>
          <strong>{task.submissionStats.total}</strong>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">已审核</p>
          <strong>{task.submissionStats.approved}</strong>
        </article>
        <article className="panel metric-card">
          <p className="card-kicker">待审核</p>
          <strong>{task.submissionStats.pending}</strong>
        </article>
      </div>

      <div className="panel stack">
        <h3>治理动作</h3>
        {task.governanceActions.length === 0 ? <p>暂无治理动作</p> : null}
        {task.governanceActions.map((action) => (
          <article key={`${action.action}-${action.operatorId}-${action.reason}`} className="list-row">
            <div>
              <strong>{action.action}</strong>
              <p>
                {action.operatorId} · {action.reason}
              </p>
            </div>
            <span className="status-pill reviewing">已记录</span>
          </article>
        ))}
      </div>
    </section>
  );
}
