type BuyerTaskDetail = {
  id: string;
  title: string;
  status: "draft" | "published" | "paused" | "ended" | "settled" | "closed";
  escrowLockedAmount: number;
  submissionCount: number;
  rewardTags: Array<"base" | "ranking" | "tip">;
};

type BuyerSubmission = {
  id: string;
  creatorId: string;
  status: "submitted" | "approved" | "rejected" | "withdrawn";
  rewardTags: Array<"base" | "ranking" | "tip">;
};

const statusText: Record<BuyerTaskDetail["status"], string> = {
  draft: "草稿",
  published: "已发布",
  paused: "已暂停",
  ended: "已结束",
  settled: "已结算",
  closed: "已关闭",
};

const submissionStatusText: Record<BuyerSubmission["status"], string> = {
  submitted: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
  withdrawn: "已撤回",
};

export function TaskDetailPage({
  task,
  submissions,
  loading,
  busySubmissionId,
  onBack,
  onApprove,
  onReject,
  onTip,
  onRank,
}: {
  task: BuyerTaskDetail | null;
  submissions: BuyerSubmission[];
  loading: boolean;
  busySubmissionId: string | null;
  onBack: () => void;
  onApprove: (submissionId: string) => void | Promise<void>;
  onReject: (submissionId: string) => void | Promise<void>;
  onTip: (submissionId: string) => void | Promise<void>;
  onRank: (submissionId: string) => void | Promise<void>;
}) {
  if (loading || !task) {
    return (
      <section className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">任务详情</p>
            <h3>加载中...</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onBack}>
            返回任务列表
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <article className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">{task.id}</p>
            <h3>{task.title}</h3>
          </div>
          <div className="row-actions">
            <span className={`status-pill ${task.status}`}>{statusText[task.status]}</span>
            <button type="button" className="ghost-button" onClick={onBack}>
              返回任务列表
            </button>
          </div>
        </div>
        <p>
          托管金额 ¥{task.escrowLockedAmount} · 投稿数 {task.submissionCount} · 奖励类型
          {task.rewardTags.join(" / ") || "-"}
        </p>
      </article>

      <article className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">投稿管理</p>
            <h3>审核 / 打赏 / 排名奖励</h3>
          </div>
        </div>
        <div className="list-table">
          {submissions.length === 0 ? <p className="muted">暂无投稿数据。</p> : null}
          {submissions.map((submission) => {
            const busy = busySubmissionId === submission.id;
            return (
              <article key={submission.id} className="list-row">
                <div>
                  <strong>{submission.id}</strong>
                  <p>
                    创作者 {submission.creatorId} · 状态 {submissionStatusText[submission.status]}
                    {submission.rewardTags.length > 0
                      ? ` · 奖励 ${submission.rewardTags.join("/")}`
                      : ""}
                  </p>
                </div>
                <div className="row-actions">
                  <span className={`status-pill ${submission.status}`}>
                    {submissionStatusText[submission.status]}
                  </span>
                  {submission.status === "submitted" ? (
                    <>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={busy}
                        onClick={() => onApprove(submission.id)}
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        className="warn-button"
                        disabled={busy}
                        onClick={() => onReject(submission.id)}
                      >
                        拒绝
                      </button>
                    </>
                  ) : null}
                  {submission.status === "approved" ? (
                    <>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={busy}
                        onClick={() => onTip(submission.id)}
                      >
                        打赏
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={busy}
                        onClick={() => onRank(submission.id)}
                      >
                        排名奖励
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
