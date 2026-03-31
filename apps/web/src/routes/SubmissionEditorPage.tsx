import type { CreatorTaskDetailModel } from "../lib/models.js";

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
    <section className="content-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">编辑投稿</h1>
          <p className="section-copy">原生创作者页：提交素材链接和文字说明。</p>
        </div>
      </div>
      <article className="task-card">
        <p className="task-meta">
          当前任务：{task ? task.title : "请先从任务池选择任务。"}
        </p>
        <p className="task-meta">投稿编号：{submissionId || "新投稿"}</p>
      </article>
      <div className="login-form">
        <div className="field">
          <label htmlFor="asset-url">素材链接</label>
          <input
            id="asset-url"
            value={form.assetUrl}
            onChange={(event) => onFieldInput("assetUrl", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="submission-description">作品说明</label>
          <input
            id="submission-description"
            value={form.description}
            onChange={(event) => onFieldInput("description", event.target.value)}
          />
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={submitting}
          onClick={onSubmitTap}
        >
          {submitting ? "提交中..." : submitLabel}
        </button>
      </div>
      {resultMessage ? <p className="status-message">{resultMessage}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </section>
  );
}
