import type { MerchantTaskDetailModel } from "../lib/models.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MerchantTaskDetailPageProps {
  task: MerchantTaskDetailModel | null;
  errorMessage?: string;
  onOpenReview?: () => void;
  onOpenSettlement?: () => void;
}

export function MerchantTaskDetailPage({
  task,
  errorMessage,
  onOpenReview,
  onOpenSettlement
}: MerchantTaskDetailPageProps) {
  const attachments = task?.assetAttachments ?? [];

  return (
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/60 animate-fade-in-up opacity-0">
        <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs font-semibold mb-2">
          需求详情
        </Badge>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          查看需求状态、投稿进度和已上传素材
        </h1>
      </div>

      {task ? (
        <Card className="border-border/60 bg-card/95 backdrop-blur-xl shadow-lg animate-fade-in-up opacity-0 stagger-1">
          <CardContent className="p-5 space-y-5">
            {/* Task Info */}
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {task.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-border/60 text-xs font-medium">
                  状态：{task.statusText}
                </Badge>
                <Badge variant="outline" className="border-border/60 text-xs font-medium">
                  奖励：{task.rewardText}
                </Badge>
                <Badge variant="outline" className="border-border/60 text-xs font-medium">
                  投稿数：{task.submissionCount}
                </Badge>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">锁定预算</p>
                <p className="font-display text-lg font-bold text-primary">{task.lockedBudgetText}</p>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  素材附件 ({attachments.length})
                </p>
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden"
                  >
                    {attachment.kind === "image" ? (
                      <img
                        className="w-full h-48 object-cover"
                        src={attachment.url}
                        alt={attachment.fileName}
                      />
                    ) : (
                      <video
                        className="w-full"
                        src={attachment.url}
                        controls
                      />
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium text-foreground">{attachment.fileName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Reward Tags */}
            {task.rewardTags.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">已发奖励</p>
                <div className="flex flex-wrap gap-2">
                  {task.rewardTags.map((tag, index) => (
                    <Badge key={index} variant="success" className="text-xs font-medium">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 border-border/60 font-semibold rounded-lg"
                onClick={onOpenReview}
              >
                前往审核
              </Button>
              <Button
                className="flex-1 h-10 bg-primary hover:bg-primary/90 font-semibold rounded-lg shadow-md shadow-primary/20"
                onClick={onOpenSettlement}
              >
                前往结算
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : errorMessage ? (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground font-medium">{errorMessage}</p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground font-medium">
            还没有需求，请先在发布需求页创建并发布
          </p>
        </div>
      )}
    </section>
  );
}
