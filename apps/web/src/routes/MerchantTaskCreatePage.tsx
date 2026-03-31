import { useState } from "react";
import {
  buildBudgetSummary,
  type MerchantTaskCreateFormModel
} from "../lib/models.js";

interface MerchantTaskCreatePageProps {
  publishing: boolean;
  publishStatus?: string;
  errorMessage?: string;
  onPublish: (form: MerchantTaskCreateFormModel) => void;
}

export function MerchantTaskCreatePage({
  publishing,
  publishStatus,
  errorMessage,
  onPublish
}: MerchantTaskCreatePageProps) {
  const [form, setForm] = useState<MerchantTaskCreateFormModel>({
    title: "春季短视频征稿",
    baseAmount: 1,
    baseCount: 2,
    rankingTotal: 1
  });
  const summary = buildBudgetSummary(form);

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <p className="section-title">发布任务</p>
          <p className="section-copy">原生商家页：配置任务信息、奖励预算和投稿限制。</p>
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
        <p className="pill">{`需锁定预算 ¥${summary.lockedTotal}`}</p>
        <button
          className="primary-button"
          type="button"
          onClick={() => onPublish(form)}
          disabled={publishing}
        >
          {publishing ? "发布中..." : "创建并发布任务"}
        </button>
        {publishStatus ? <p className="status-message">{publishStatus}</p> : null}
        {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      </article>
    </section>
  );
}
