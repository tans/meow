import { taskDetailPreview } from "../lib/api.js";

interface TaskDetailPageProps {
  task?: typeof taskDetailPreview;
  onBack?: () => void;
}

export function TaskDetailPage({
  task = taskDetailPreview,
  onBack = () => undefined
}: TaskDetailPageProps) {
  return (
    <section className="page-grid">
      <div className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">{task.id}</p>
            <h3>{task.title}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onBack}>
            返回任务列表
          </button>
        </div>
        <p>{task.phase}</p>
      </div>

      <div className="metric-grid">
        {task.rewardSummary.map((item) => (
          <article key={item.label} className="panel metric-card">
            <p className="card-kicker">{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="panel stack">
        <h3>稿件与奖励</h3>
        {task.submissions.map((submission) => (
          <article key={submission.id} className="list-row">
            <div>
              <strong>{submission.creator}</strong>
              <p>{submission.rewardTag}</p>
            </div>
            <span className={`status-pill ${submission.status}`}>{submission.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
