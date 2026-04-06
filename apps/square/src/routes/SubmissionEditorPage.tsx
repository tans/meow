import type { CreatorTaskDetailModel } from "../lib/models.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubmissionEditorPageProps {
  task: CreatorTaskDetailModel | null;
  submissionId: string;
  submitLabel: string;
  form: {
    assetUrl: string;
    description: string;
  };
  resultMessage?: string;
  errorMessage?: string;
  submitting?: boolean;
  onFieldInput: (field: "assetUrl" | "description", value: string) => void;
  onSubmitTap: () => void;
}

export function SubmissionEditorPage({
  task,
  submissionId,
  submitLabel,
  form,
  resultMessage,
  errorMessage,
  submitting = false,
  onFieldInput,
  onSubmitTap
}: SubmissionEditorPageProps) {
  return (
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-white shadow-lg shadow-primary/20 animate-fade-in-up opacity-0">
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs font-semibold mb-2">
            {submissionId ? "修改投稿" : "新投稿"}
          </Badge>
          <h1 className="font-display text-2xl font-bold tracking-tight">编辑投稿</h1>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">
            原生创作者页：提交素材链接和文字说明
          </p>
        </div>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-accent/30 rounded-full blur-xl" />
      </div>

      {/* Task Info */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm animate-fade-in-up opacity-0 stagger-1">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">当前任务</p>
          <p className="font-medium text-foreground mt-0.5">
            {task ? task.title : "请先从任务池选择任务。"}
          </p>
          <Badge variant="outline" className="mt-2 text-xs font-medium border-border/60">
            投稿编号：{submissionId || "新投稿"}
          </Badge>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-border/60 bg-card/95 backdrop-blur-xl shadow-lg animate-fade-in-up opacity-0 stagger-2">
        <CardContent className="p-5 space-y-5">
          {/* Asset URL */}
          <div className="space-y-2">
            <Label htmlFor="asset-url" className="text-sm font-semibold text-foreground/80">
              素材链接
            </Label>
            <Input
              id="asset-url"
              value={form.assetUrl}
              onChange={(event) => onFieldInput("assetUrl", event.target.value)}
              placeholder="https://example.com/demo.mp4"
              className="h-11 border-border/60 bg-background/50 focus:bg-background"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="submission-description" className="text-sm font-semibold text-foreground/80">
              作品说明
            </Label>
            <Input
              id="submission-description"
              value={form.description}
              onChange={(event) => onFieldInput("description", event.target.value)}
              placeholder="介绍一下你的创作思路..."
              className="h-11 border-border/60 bg-background/50 focus:bg-background"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            disabled={submitting}
            onClick={onSubmitTap}
            className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold rounded-lg shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                提交中...
              </span>
            ) : submitLabel}
          </Button>

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
        </CardContent>
      </Card>
    </section>
  );
}
