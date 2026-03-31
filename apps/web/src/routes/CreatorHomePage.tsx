import type { CreatorTaskCardModel } from "../lib/models.js";
import { TaskCard } from "../components/TaskCard.js";

interface CreatorHomePageProps {
  channels?: string[];
  activeChannel?: string;
  tasks?: CreatorTaskCardModel[];
  onTaskTap?: (taskId: string) => void;
}

export function CreatorHomePage({
  channels = ["推荐", "品牌合作", "急单", "同城"],
  activeChannel = "推荐",
  tasks = [],
  onTaskTap
}: CreatorHomePageProps) {
  return (
    <section className="content-section content-section--home">
      <div className="section-header section-header--hero">
        <div>
          <h1 className="section-title">悬赏大厅</h1>
          <p className="section-copy">原生创作者页：浏览公开任务和奖励规则。</p>
        </div>
      </div>
      <div className="shell-nav chip-strip" aria-label="任务频道">
        {channels.map((channel) => (
          <span
            key={channel}
            className={
              channel === activeChannel ? "meta-pill meta-pill--active" : "meta-pill"
            }
          >
            <span>{channel}</span>
          </span>
        ))}
      </div>
      {tasks.length > 0 ? (
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              eyebrow={task.brandName}
              meta={task.rewardText}
              detail={task.metaText}
              footer={
                <div className="stack-page">
                  <p className="section-copy">{task.summary}</p>
                  <div className="inline-actions">
                    <span className="pill">{task.highlightTag}</span>
                    {onTaskTap ? (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => onTaskTap(task.id)}
                      >
                        查看任务
                      </button>
                    ) : null}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">暂无可参与任务，稍后再来刷新。</p>
      )}
    </section>
  );
}
