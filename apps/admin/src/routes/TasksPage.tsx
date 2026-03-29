import { taskListPreview, type TaskSummary } from "../lib/api.js";

interface TasksPageProps {
  tasks?: TaskSummary[];
  onOpenTask?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
}

export function TasksPage({
  tasks = taskListPreview,
  onOpenTask = () => undefined,
  onPause = () => undefined
}: TasksPageProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">任务管理</p>
          <h3>主交易链任务看板</h3>
        </div>
      </div>
      <div className="task-table">
        {tasks.map((task) => (
          <article key={task.id} className="task-row">
            <div>
              <strong>{task.title}</strong>
              <p>
                {task.merchant} · 投稿 {task.submissions} · 托管 {task.lockedBudget}
              </p>
            </div>
            <div className="task-actions">
              <span className={`status-pill ${task.status}`}>{task.status}</span>
              <button
                type="button"
                className="ghost-button"
                onClick={() => onPause(task.id)}
              >
                暂停任务
              </button>
              <button type="button" className="ghost-button" onClick={() => onOpenTask(task.id)}>
                查看详情
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
