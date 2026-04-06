import type {
  CreatorSubmissionCardModel,
  CreatorTaskDetailModel
} from "../lib/models.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TaskDetailPageProps {
  task: CreatorTaskDetailModel | null;
  submissionCards: CreatorSubmissionCardModel[];
  feedbackMessage?: string;
  errorMessage?: string;
  onSubmitTap: () => void;
  onEditTap: (submissionId: string) => void;
  onWithdrawTap: (submissionId: string) => void;
}

export function TaskDetailPage({
  task,
  submissionCards,
  feedbackMessage,
  errorMessage,
  onSubmitTap,
  onEditTap,
  onWithdrawTap
}: TaskDetailPageProps) {
  if (!task) {
    return (
      <section className="space-y-4 animate-fade-in">
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            {errorMessage ?? "请先从任务池选择任务。"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-6">
      {/* Hero */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/60 animate-fade-in-up opacity-0">
        <Badge variant="secondary" className="bg-primary/8 text-primary border-primary/20 text-xs font-semibold mb-3">
          任务详情
        </Badge>
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {task.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">状态：{task.status}</p>
        <p className="text-sm text-muted-foreground">奖励：{task.rewardText}</p>
        <p className="text-sm text-muted-foreground">我的投稿：{task.creatorSubmissionCount}</p>
        {task.canSubmit ? (
          <Button
            className="mt-4 bg-primary hover:bg-primary/90 font-semibold rounded-lg shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
            onClick={onSubmitTap}
          >
            立即投稿
          </Button>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground/60">当前任务不可投稿</p>
        )}
      </div>

      {/* Submissions */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/60 animate-fade-in-up opacity-0 stagger-1">
        <h2 className="font-display text-lg font-semibold tracking-tight mb-4">我的投稿</h2>
        {submissionCards.length > 0 ? (
          <div className="space-y-3">
            {submissionCards.map((item) => (
              <div
                key={item.submissionId}
                className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-muted/30"
              >
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">状态：{item.statusText}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                    {item.rewardTag}
                  </span>
                  {item.canEdit ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-border/60 text-foreground/80 hover:border-primary/30 hover:text-primary font-medium"
                      onClick={() => onEditTap(item.submissionId)}
                    >
                      修改
                    </Button>
                  ) : null}
                  {item.canWithdraw ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-border/60 text-destructive/80 hover:border-destructive/30 hover:text-destructive font-medium"
                      onClick={() => onWithdrawTap(item.submissionId)}
                    >
                      撤回
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60 py-4 text-center">
            还没有投稿记录
          </p>
        )}
      </div>

      {/* Feedback Messages */}
      {feedbackMessage ? (
        <p className="rounded-xl bg-success/10 border border-success/20 p-4 text-sm text-success font-medium animate-fade-in">
          {feedbackMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium animate-fade-in">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
