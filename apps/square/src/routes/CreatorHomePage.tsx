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
    <section className="space-y-5 pb-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-white shadow-lg shadow-primary/20">
        <div className="relative z-10">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            悬赏大厅
          </h1>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">
            原生创作者页：浏览公开任务和奖励规则
          </p>
        </div>
        {/* Decorative blob */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-accent/30 rounded-full blur-xl" />
      </div>

      {/* Channel Pills */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 -mx-1" aria-label="任务频道">
        {channels.map((channel, index) => (
          <span
            key={channel}
            className={`
              inline-flex items-center rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap
              transition-all duration-300 cursor-pointer
              animate-fade-in-up opacity-0
              ${channel === activeChannel
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 -translate-y-0.5"
                : "bg-card border border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:-translate-y-0.5"
              }
            `}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {channel}
          </span>
        ))}
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: `${(index + 3) * 80}ms` }}
            >
              <TaskCard
                title={task.title}
                eyebrow={task.brandName}
                meta={task.rewardText}
                detail={task.metaText}
                footer={
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{task.summary}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-muted/80 px-3 py-1 text-xs font-medium text-foreground/80">
                        {task.highlightTag}
                      </span>
                      {onTaskTap ? (
                        <button
                          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97]"
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
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            暂无可参与任务，稍后再来刷新
          </p>
        </div>
      )}
    </section>
  );
}
