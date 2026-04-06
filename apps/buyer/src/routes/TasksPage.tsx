import type { MerchantTaskAttachment } from "@meow/contracts";
import type { DraftTaskForm } from "./types";

type BuyerTask = {
  id: string;
  title: string;
  status: "draft" | "published" | "paused" | "ended" | "settled" | "closed";
  submissionCount: number;
  escrowLockedAmount: number;
};

const statusText: Record<BuyerTask["status"], string> = {
  draft: "草稿",
  published: "已发布",
  paused: "已暂停",
  ended: "已结束",
  settled: "已结算",
  closed: "已关闭",
};

export function TasksPage({
  form,
  uploading,
  creating,
  assets,
  tasks,
  busyTaskId,
  onFormChange,
  onPickFiles,
  onRemoveAsset,
  onCreate,
  onOpen,
  onPublish,
  onSettle,
}: {
  form: DraftTaskForm;
  uploading: boolean;
  creating: boolean;
  assets: MerchantTaskAttachment[];
  tasks: BuyerTask[];
  busyTaskId: string | null;
  onFormChange: (patch: Partial<DraftTaskForm>) => void;
  onPickFiles: (files: FileList | null) => void | Promise<void>;
  onRemoveAsset: (assetId: string) => void;
  onCreate: () => void | Promise<void>;
  onOpen: (taskId: string) => void;
  onPublish: (taskId: string) => void | Promise<void>;
  onSettle: (taskId: string) => void | Promise<void>;
}) {
  return (
    <section className="stack">
      <section className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">创建需求</p>
            <h3>快速生成任务草稿</h3>
          </div>
        </div>

        <div className="form-grid">
          <label className="field-label">
            <span>任务标题</span>
            <input
              className="field-input"
              value={form.title}
              placeholder="例如：春季新品短视频征集"
              onChange={(event) => onFormChange({ title: event.currentTarget.value })}
            />
          </label>

          <div className="inline-row">
            <label className="field-label" style={{ flex: 1 }}>
              <span>基础奖励单价</span>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.baseAmount}
                onChange={(event) => onFormChange({ baseAmount: Number(event.currentTarget.value) })}
              />
            </label>
            <label className="field-label" style={{ flex: 1 }}>
              <span>基础奖励数量</span>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.baseCount}
                onChange={(event) => onFormChange({ baseCount: Number(event.currentTarget.value) })}
              />
            </label>
            <label className="field-label" style={{ flex: 1 }}>
              <span>排名奖励池</span>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.rankingTotal}
                onChange={(event) =>
                  onFormChange({ rankingTotal: Number(event.currentTarget.value) })
                }
              />
            </label>
          </div>

          <label className="field-label">
            <span>素材附件（图片/视频）</span>
            <input
              className="field-input"
              type="file"
              multiple
              accept="image/*,video/*"
              disabled={uploading || creating}
              onChange={(event) => onPickFiles(event.currentTarget.files)}
            />
            <span className="muted">
              {uploading ? "上传中..." : "上传后会作为任务素材附加到草稿中"}
            </span>
          </label>

          {assets.length > 0 ? (
            <div className="list-table">
              {assets.map((asset) => (
                <article key={asset.id} className="list-row">
                  <div>
                    <strong>{asset.fileName}</strong>
                    <p>
                      {asset.kind} · {asset.mimeType}
                    </p>
                  </div>
                  <div className="row-actions">
                    <a className="ghost-button" href={asset.url} target="_blank" rel="noreferrer">
                      预览
                    </a>
                    <button
                      type="button"
                      className="warn-button"
                      onClick={() => onRemoveAsset(asset.id)}
                    >
                      移除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <button type="button" className="primary-button" disabled={creating} onClick={onCreate}>
            {creating ? "创建中..." : "创建草稿"}
          </button>
        </div>
      </section>

      <section className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">任务列表</p>
            <h3>发布与结算操作区</h3>
          </div>
        </div>

        <div className="task-table">
          {tasks.length === 0 ? <p className="muted">暂无任务，请先创建草稿。</p> : null}
          {tasks.map((task) => (
            <article key={task.id} className="task-row">
              <div>
                <strong>{task.title}</strong>
                <p>
                  {task.id} · 投稿 {task.submissionCount} · 托管 ¥{task.escrowLockedAmount}
                </p>
              </div>
              <div className="row-actions">
                <span className={`status-pill ${task.status}`}>{statusText[task.status]}</span>
                <button type="button" className="ghost-button" onClick={() => onOpen(task.id)}>
                  查看详情
                </button>
                {task.status === "draft" ? (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={busyTaskId === task.id}
                    onClick={() => onPublish(task.id)}
                  >
                    {busyTaskId === task.id ? "发布中..." : "发布任务"}
                  </button>
                ) : null}
                {task.status === "published" || task.status === "ended" ? (
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={busyTaskId === task.id}
                    onClick={() => onSettle(task.id)}
                  >
                    {busyTaskId === task.id ? "结算中..." : "执行结算"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
