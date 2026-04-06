import type { MerchantReviewCardModel } from "../lib/models.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MerchantReviewPageProps {
  task: {
    title: string;
    rewardText: string;
  } | null;
  cards: MerchantReviewCardModel[];
  feedbackMessage?: string;
  errorMessage?: string;
  actionPending?: boolean;
  onApprove: (submissionId: string) => void;
  onTip: (submissionId: string) => void;
  onRanking: (submissionId: string) => void;
}

export function MerchantReviewPage({
  task,
  cards,
  feedbackMessage,
  errorMessage,
  actionPending = false,
  onApprove,
  onTip,
  onRanking
}: MerchantReviewPageProps) {
  return (
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-6 text-white shadow-lg shadow-primary/20 animate-fade-in-up opacity-0">
        <div className="relative z-10">
          <h1 className="font-display text-2xl font-bold tracking-tight">稿件审核</h1>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">
            审核合作稿件，通过后冻结基础奖励
          </p>
        </div>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-accent/30 rounded-full blur-xl" />
      </div>

      {/* Task Info */}
      {task ? (
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm animate-fade-in-up opacity-0 stagger-1">
          <CardContent className="p-4">
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              {task.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{task.rewardText}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Submission Cards */}
      {cards.length > 0 ? (
        <div className="space-y-4">
          {cards.map((item, index) => (
            <Card
              key={item.submissionId}
              className="border-border/60 bg-card/80 backdrop-blur-sm card-hover animate-fade-in-up opacity-0"
              style={{ animationDelay: `${(index + 2) * 80}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{item.creatorText}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={item.statusText === "已通过" ? "success" : "outline"}
                        className="text-xs font-medium"
                      >
                        {item.statusText}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-medium bg-primary/8 text-primary border-primary/20">
                        {item.rewardTag}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.canApprove ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg border-success/30 text-success hover:bg-success/10 hover:border-success font-semibold"
                      disabled={actionPending}
                      onClick={() => onApprove(item.submissionId)}
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      通过
                    </Button>
                  ) : null}
                  {item.canTip ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg border-warning/30 text-warning hover:bg-warning/10 hover:border-warning font-semibold"
                      disabled={actionPending}
                      onClick={() => onTip(item.submissionId)}
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      打赏
                    </Button>
                  ) : null}
                  {item.canRanking ? (
                    <Button
                      size="sm"
                      className="h-9 rounded-lg bg-accent hover:bg-accent/90 font-semibold shadow-md shadow-accent/20"
                      disabled={actionPending}
                      onClick={() => onRanking(item.submissionId)}
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      排名奖
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
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
            还没有投稿，请先在创作者身份下提交作品
          </p>
        </div>
      )}

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
