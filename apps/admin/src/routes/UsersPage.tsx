import type { PaginationMeta, UserQuery, UserSummary } from "../lib/api.js";

type UserFilterState = Required<Pick<UserQuery, "page" | "pageSize">> & {
  state: string;
  role: string;
  keyword: string;
};

interface UsersPageProps {
  users?: UserSummary[];
  filters?: UserFilterState;
  pagination?: PaginationMeta;
  loading?: boolean;
  onFiltersChange?: (patch: Partial<UserFilterState>) => void;
  onApplyFilters?: () => void;
  onPageChange?: (page: number) => void;
  onBan?: (userId: string) => void;
  busyUserId?: string | null;
}

export function UsersPage({
  users = [],
  filters = {
    page: 1,
    pageSize: 20,
    state: "",
    role: "",
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
  onBan = () => undefined,
  busyUserId = null
}: UsersPageProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">用户管理</p>
          <h3>商家 / 创作者 / 运营账号</h3>
        </div>
      </div>
      <div className="filter-grid">
        <label className="field-label">
          <span>关键字</span>
          <input
            aria-label="用户关键字"
            className="field-input"
            value={filters.keyword}
            placeholder="搜索用户 ID / 邮箱 / 名称"
            onChange={(event) => onFiltersChange({ keyword: event.currentTarget.value })}
          />
        </label>
        <label className="field-label">
          <span>角色</span>
          <select
            aria-label="用户角色"
            className="field-input"
            value={filters.role}
            onChange={(event) => onFiltersChange({ role: event.currentTarget.value })}
          >
            <option value="">全部角色</option>
            <option value="merchant">merchant</option>
            <option value="creator">creator</option>
            <option value="operator">operator</option>
          </select>
        </label>
        <label className="field-label">
          <span>状态</span>
          <select
            aria-label="用户状态"
            className="field-input"
            value={filters.state}
            onChange={(event) => onFiltersChange({ state: event.currentTarget.value })}
          >
            <option value="">全部状态</option>
            <option value="active">active</option>
            <option value="banned">banned</option>
          </select>
        </label>
        <div className="filter-actions">
          <button
            type="button"
            aria-label="应用用户筛选"
            className="ghost-button"
            disabled={loading}
            onClick={onApplyFilters}
          >
            {loading ? "筛选中..." : "应用用户筛选"}
          </button>
        </div>
      </div>
      <div className="result-meta">
        <span>
          第 {pagination.page} / {totalPages} 页 · 共 {pagination.total} 条
        </span>
      </div>
      {users.length === 0 ? <p>暂无用户数据</p> : null}
      {users.map((user) => (
        <article key={user.id} className="list-row">
          <div>
            <strong>{user.displayName}</strong>
            <p>
              {user.roles.join(" / ")} · {user.identifier}
            </p>
          </div>
          <div className="task-actions">
            <span className={`status-pill ${user.state === "active" ? "published" : "paused"}`}>
              {user.state}
            </span>
            {user.state === "active" && !user.roles.includes("operator") ? (
              <button
                type="button"
                className="ghost-button"
                disabled={busyUserId === user.id}
                onClick={() => onBan(user.id)}
              >
                封禁用户
              </button>
            ) : null}
          </div>
        </article>
      ))}
      <div className="pagination-row">
        <button
          type="button"
          aria-label="上一页用户"
          className="ghost-button"
          disabled={loading || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          上一页用户
        </button>
        <button
          type="button"
          aria-label="下一页用户"
          className="ghost-button"
          disabled={loading || pagination.page >= totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          下一页用户
        </button>
      </div>
    </section>
  );
}
