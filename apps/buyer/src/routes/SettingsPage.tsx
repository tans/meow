import type { DraftTaskForm } from "./types";

export function SettingsPage({
  defaults,
  onChange,
}: {
  defaults: DraftTaskForm;
  onChange: (patch: Partial<DraftTaskForm>) => void;
}) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">账户设置</p>
          <h3>默认发布参数</h3>
        </div>
      </div>
      <p className="muted">以下设置仅保存在当前浏览器会话中，用于加速创建任务草稿。</p>
      <div className="form-grid">
        <label className="field-label">
          <span>默认任务标题模板</span>
          <input
            className="field-input"
            value={defaults.title}
            onChange={(event) => onChange({ title: event.currentTarget.value })}
          />
        </label>
        <label className="field-label">
          <span>默认基础奖励单价</span>
          <input
            className="field-input"
            type="number"
            min={0}
            value={defaults.baseAmount}
            onChange={(event) => onChange({ baseAmount: Number(event.currentTarget.value) })}
          />
        </label>
        <label className="field-label">
          <span>默认基础奖励数量</span>
          <input
            className="field-input"
            type="number"
            min={0}
            value={defaults.baseCount}
            onChange={(event) => onChange({ baseCount: Number(event.currentTarget.value) })}
          />
        </label>
        <label className="field-label">
          <span>默认排名奖励池</span>
          <input
            className="field-input"
            type="number"
            min={0}
            value={defaults.rankingTotal}
            onChange={(event) => onChange({ rankingTotal: Number(event.currentTarget.value) })}
          />
        </label>
      </div>
    </section>
  );
}
