import type { MerchantSettlementModel } from "../lib/models.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MerchantSettlementPageProps {
  settlement: MerchantSettlementModel | null;
  resultMessage?: string;
  errorMessage?: string;
  settling?: boolean;
  onSettle: () => void;
}

export function MerchantSettlementPage({
  settlement,
  resultMessage,
  errorMessage,
  settling = false,
  onSettle
}: MerchantSettlementPageProps) {
  return (
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/90 via-success to-primary/80 p-6 text-white shadow-lg shadow-success/20 animate-fade-in-up opacity-0">
        <div className="relative z-10">
          <h1 className="font-display text-2xl font-bold tracking-tight">需求结算</h1>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">
            释放奖励并退回未使用预算
          </p>
        </div>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/30 rounded-full blur-xl" />
      </div>

      {settlement ? (
        <Card className="border-border/60 bg-card/95 backdrop-blur-xl shadow-lg animate-fade-in-up opacity-0 stagger-1">
          <CardContent className="p-5 space-y-5">
            {/* Settlement Info */}
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {settlement.title}
              </h2>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1 rounded-xl bg-muted/30 p-3 text-center">
                  <p className="font-display text-2xl font-bold text-foreground">
                    {settlement.submittedCount}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">投稿数</p>
                </div>
                <div className="flex-1 rounded-xl bg-success/10 p-3 text-center">
                  <p className="font-display text-2xl font-bold text-success">
                    {settlement.approvedCount}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">通过数</p>
                </div>
              </div>
            </div>

            {/* Reward Preview */}
            {settlement.rewardPreview.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  奖励预览
                </p>
                <div className="flex flex-wrap gap-2">
                  {settlement.rewardPreview.map((item, index) => (
                    <Badge key={index} variant="success" className="text-xs font-medium bg-success/10 text-success border-success/20">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Settle Button */}
            <Button
              className="w-full h-11 bg-success hover:bg-success/90 font-semibold rounded-lg shadow-md shadow-success/20 transition-all duration-200 active:scale-[0.98]"
              type="button"
              disabled={settling}
              onClick={onSettle}
            >
              {settling ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  结算中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  执行结算
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground font-medium">暂无待结算任务</p>
        </div>
      )}

      {/* Result Messages */}
      {resultMessage ? (
        <p className="rounded-xl bg-success/10 border border-success/20 p-4 text-sm text-success font-medium animate-fade-in">
          {resultMessage}
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
