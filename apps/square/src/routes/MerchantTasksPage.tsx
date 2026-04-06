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
    <section className="space-y-5 pb-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/90 via-accent to-accent/80 p-6 text-white shadow-lg shadow-accent/20">
        <div className="relative z-10">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            需求管理
          </h1>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">
            查看已发布需求和当前投稿进度
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/30 rounded-full blur-xl" />
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <TaskCard
                title={task.title}
                eyebrow={task.statusText}
                meta={`${task.submissionCount} 件投稿`}
                detail="继续推进审核与结算节奏"
                footer={
                  <button
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 active:scale-[0.97]"
                    type="button"
                    onClick={() => onTaskTap?.(task.id)}
                  >
                    查看详情
                  </button>
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            暂无需求，先创建第一条合作需求
          </p>
        </div>
      )}
    </section>
  );
}
