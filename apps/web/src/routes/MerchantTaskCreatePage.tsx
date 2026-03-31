import { useState } from "react";
import type { MerchantTaskAttachment } from "@meow/contracts";
import {
  buildBudgetSummary,
  type MerchantTaskCreateFormModel
} from "../lib/models.js";

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
    <section className="content-section">
      <div className="section-header">
        <div>
          <p className="section-title">发布需求</p>
          <p className="section-copy">配置需求信息、奖励预算和多媒体素材。</p>
        </div>
      </div>
      <article className="task-card">
        <div className="field">
          <label>
            任务标题
            <input
              aria-label="任务标题"
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
        </div>
        <div className="field">
          <label>
            基础奖金额
            <input
              aria-label="基础奖金额"
              type="number"
              value={form.baseAmount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  baseAmount: Number(event.target.value || 0)
                }))
              }
            />
          </label>
        </div>
        <div className="field">
          <label>
            基础奖份数
            <input
              aria-label="基础奖份数"
              type="number"
              value={form.baseCount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  baseCount: Number(event.target.value || 0)
                }))
              }
            />
          </label>
        </div>
        <div className="field">
          <label>
            排名奖总额
            <input
              aria-label="排名奖总额"
              type="number"
              value={form.rankingTotal}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rankingTotal: Number(event.target.value || 0)
                }))
              }
            />
          </label>
        </div>
        <div className="field">
          <label htmlFor="merchant-asset-upload">需求素材上传</label>
          <input
            id="merchant-asset-upload"
            aria-label="需求素材上传"
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
          />
        </div>
        {assetAttachments.length > 0 ? (
          <div className="attachment-list">
            {assetAttachments.map((attachment) => (
              <div key={attachment.id} className="attachment-item">
                <div className="attachment-item__meta">
                  <p className="task-title">{attachment.fileName}</p>
                  <p className="task-meta">
                    {attachment.kind === "image" ? "图片素材" : "视频素材"}
                  </p>
                </div>
                <button
                  className="secondary-button"
                  type="button"
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
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <p className="pill">{`需锁定预算 ¥${summary.lockedTotal}`}</p>
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            onPublish({
              ...form,
              assetAttachments
            })
          }
          disabled={publishing || uploadingAssets}
        >
          {publishing ? "发布中..." : "创建并发布需求"}
        </button>
        {publishStatus ? <p className="status-message">{publishStatus}</p> : null}
        {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      </article>
    </section>
  );
}
