import { TaskCard } from "../components/TaskCard.js";
import type { MerchantTaskCardModel } from "../lib/models.js";

interface MerchantTasksPageProps {
  tasks?: MerchantTaskCardModel[];
  onTaskTap?: (taskId: string) => void;
}

export function MerchantTasksPage({
  tasks = [],
  onTaskTap
}: MerchantTasksPageProps) {
  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <p className="section-title">任务管理</p>
          <p className="section-copy">原生商家页：查看任务列表与投稿进度。</p>
        </div>
      </div>
      {tasks.length > 0 ? (
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              eyebrow={task.statusText}
              meta={`${task.submissionCount} 件投稿`}
              detail="继续推进审核与结算节奏"
              footer={
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => onTaskTap?.(task.id)}
                >
                  查看详情
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">暂无任务，先创建第一条悬赏。</p>
      )}
    </section>
  );
}
