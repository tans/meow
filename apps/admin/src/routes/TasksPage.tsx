import type { PaginationMeta, TaskQuery, TaskSummary } from "../lib/api.js";

type TaskFilterState = Required<Pick<TaskQuery, "page" | "pageSize">> & {
  status: string;
  keyword: string;
};

interface TasksPageProps {
  tasks?: TaskSummary[];
  filters?: TaskFilterState;
  pagination?: PaginationMeta;
  loading?: boolean;
  onFiltersChange?: (patch: Partial<TaskFilterState>) => void;
  onApplyFilters?: () => void;
  onPageChange?: (page: number) => void;
  onOpenTask?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
  onResume?: (taskId: string) => void;
  busyTaskId?: string | null;
}

export function TasksPage({
  tasks = [],
  filters = {
    page: 1,
    pageSize: 20,
    status: "",
    keyword: ""
  },
  pagination = {
    page: 1,
    pageSize: 20,
    total: 0
  },
  loading = false,
  onFiltersChange = () => undefined,
  onApplyFilters = () => undefined,
  onPageChange = () => undefined,
  onOpenTask = () => undefined,
  onPause = () => undefined,
  onResume = () => undefined,
  busyTaskId = null
}: TasksPageProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">任务管理</p>
          <h3>主交易链任务看板</h3>
        </div>
      </div>
      <div className="filter-grid">
        <label className="field-label">
          <span>关键字</span>
          <input
            aria-label="任务关键字"
            className="field-input"
            value={filters.keyword}
            placeholder="搜索任务 ID 或标题"
            onChange={(event) => onFiltersChange({ keyword: event.currentTarget.value })}
          />
        </label>
        <label className="field-label">
          <span>状态</span>
          <select
            aria-label="任务状态"
            className="field-input"
            value={filters.status}
            onChange={(event) => onFiltersChange({ status: event.currentTarget.value })}
          >
            <option value="">全部状态</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="paused">paused</option>
            <option value="ended">ended</option>
            <option value="settled">settled</option>
            <option value="closed">closed</option>
          </select>
        </label>
        <div className="filter-actions">
          <button
            type="button"
            aria-label="应用任务筛选"
            className="ghost-button"
            disabled={loading}
            onClick={onApplyFilters}
          >
            {loading ? "筛选中..." : "应用任务筛选"}
          </button>
        </div>
      </div>
      <div className="result-meta">
        <span>
          第 {pagination.page} / {totalPages} 页 · 共 {pagination.total} 条
        </span>
      </div>
      <div className="task-table">
        {tasks.length === 0 ? <p>暂无任务数据</p> : null}
        {tasks.map((task) => (
          <article key={task.id} className="task-row">
            <div>
              <strong>{task.title}</strong>
              <p>
                {task.merchant} · 投稿 {task.submissions} · 托管 {task.lockedBudget}
              </p>
            </div>
            <div className="task-actions">
              <span className={`status-pill ${task.status}`}>{task.status}</span>
              <button
                type="button"
                className="ghost-button"
                disabled={busyTaskId === task.id}
                onClick={() =>
                  task.status === "paused" ? onResume(task.id) : onPause(task.id)
                }
              >
                {task.status === "paused" ? "恢复任务" : "暂停任务"}
              </button>
              <button type="button" className="ghost-button" onClick={() => onOpenTask(task.id)}>
                查看详情
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="pagination-row">
        <button
          type="button"
          aria-label="上一页任务"
          className="ghost-button"
          disabled={loading || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          上一页任务
        </button>
        <button
          type="button"
          aria-label="下一页任务"
          className="ghost-button"
          disabled={loading || pagination.page >= totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          下一页任务
        </button>
      </div>
    </section>
  );
}
