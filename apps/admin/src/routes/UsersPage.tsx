import type { UserSummary } from "../lib/api.js";

interface UsersPageProps {
  users?: UserSummary[];
  onBan?: (userId: string) => void;
  busyUserId?: string | null;
}

export function UsersPage({
  users = [],
  onBan = () => undefined,
  busyUserId = null
}: UsersPageProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">用户管理</p>
          <h3>商家 / 创作者 / 运营账号</h3>
        </div>
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
    </section>
  );
}
