import { useState } from "react";
import type { MerchantTaskAttachment } from "@meow/contracts";
import {
  buildBudgetSummary,
  type MerchantTaskCreateFormModel
} from "../lib/models.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MerchantTaskCreatePageProps {
  publishing: boolean;
  uploadingAssets: boolean;
  assetAttachments: MerchantTaskAttachment[];
  publishStatus?: string;
  errorMessage?: string;
  onUploadAssets: (files: File[]) => Promise<MerchantTaskAttachment[]>;
  onRemoveAsset: (assetId: string) => void;
  onPublish: (form: MerchantTaskCreateFormModel) => void;
}

export function MerchantTaskCreatePage({
  publishing,
  uploadingAssets,
  assetAttachments,
  publishStatus,
  errorMessage,
  onUploadAssets,
  onRemoveAsset,
  onPublish
}: MerchantTaskCreatePageProps) {
  const [form, setForm] = useState<MerchantTaskCreateFormModel>({
    title: "春季短视频征稿",
    baseAmount: 1,
    baseCount: 2,
    rankingTotal: 1,
    assetAttachments: []
  });
  const summary = buildBudgetSummary(form);

  return (
    <section className="space-y-5 pb-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/90 via-accent to-primary/80 p-6 text-white shadow-lg shadow-accent/20 animate-fade-in-up opacity-0">
        <div className="relative z-10">
          <h1 className="font-display text-2xl font-bold tracking-tight">发布需求</h1>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">
            配置需求信息、奖励预算和多媒体素材
          </p>
        </div>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/30 rounded-full blur-xl" />
      </div>

      {/* Form */}
      <Card className="border-border/60 bg-card/95 backdrop-blur-xl shadow-lg animate-fade-in-up opacity-0 stagger-1">
        <CardContent className="p-5 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-semibold text-foreground/80">
              任务标题
            </Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="h-11 border-border/60 bg-background/50 focus:bg-background"
            />
          </div>

          {/* Budget Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base-amount" className="text-sm font-semibold text-foreground/80">
                基础奖金额 (¥)
              </Label>
              <Input
                id="base-amount"
                type="number"
                value={form.baseAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    baseAmount: Number(event.target.value || 0)
                  }))
                }
                className="h-11 border-border/60 bg-background/50 focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-count" className="text-sm font-semibold text-foreground/80">
                基础奖份数
              </Label>
              <Input
                id="base-count"
                type="number"
                value={form.baseCount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    baseCount: Number(event.target.value || 0)
                  }))
                }
                className="h-11 border-border/60 bg-background/50 focus:bg-background"
              />
            </div>
          </div>

          {/* Ranking Total */}
          <div className="space-y-2">
            <Label htmlFor="ranking-total" className="text-sm font-semibold text-foreground/80">
              排名奖总额 (¥)
            </Label>
            <Input
              id="ranking-total"
              type="number"
              value={form.rankingTotal}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rankingTotal: Number(event.target.value || 0)
                }))
              }
              className="h-11 border-border/60 bg-background/50 focus:bg-background"
            />
          </div>

          {/* Asset Upload */}
          <div className="space-y-2">
            <Label htmlFor="merchant-asset-upload" className="text-sm font-semibold text-foreground/80">
              需求素材上传
            </Label>
            <Input
              id="merchant-asset-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              disabled={uploadingAssets || publishing}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);

                if (files.length === 0) {
                  return;
                }

                void (async () => {
                  const uploaded = await onUploadAssets(files);
                  setForm((current) => ({
                    ...current,
                    assetAttachments: [...current.assetAttachments, ...uploaded]
                  }));
                  event.target.value = "";
                })();
              }}
              className="h-11 border-border/60 bg-background/50 focus:bg-background file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground/80 hover:file:bg-muted/80"
            />
          </div>

          {/* Asset Attachments */}
          {assetAttachments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                已上传素材 ({assetAttachments.length})
              </p>
              {assetAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 transition-all duration-200 hover:border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {attachment.kind === "image" ? (
                        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.kind === "image" ? "图片素材" : "视频素材"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                    disabled={uploadingAssets || publishing}
                    onClick={() => {
                      onRemoveAsset(attachment.id);
                      setForm((current) => ({
                        ...current,
                        assetAttachments: current.assetAttachments.filter(
                          (item) => item.id !== attachment.id
                        )
                      }));
                    }}
                  >
                    移除
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {/* Budget Summary */}
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">需锁定预算</p>
              <p className="font-display text-xl font-bold text-primary">¥{summary.lockedTotal}</p>
            </div>
            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
              {form.baseCount}份基础 + 排名奖
            </Badge>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full h-11 bg-accent hover:bg-accent/90 font-semibold rounded-lg shadow-md shadow-accent/20 transition-all duration-200 active:scale-[0.98]"
            type="button"
            onClick={() =>
              onPublish({
                ...form,
                assetAttachments
              })
            }
            disabled={publishing || uploadingAssets}
          >
            {publishing ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                发布中...
              </span>
            ) : "创建并发布需求"}
          </Button>

          {/* Status Messages */}
          {publishStatus ? (
            <p className="rounded-xl bg-success/10 border border-success/20 p-4 text-sm text-success font-medium animate-fade-in">
              {publishStatus}
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
