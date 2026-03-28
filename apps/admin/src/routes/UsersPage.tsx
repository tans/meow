import { userListPreview, type UserSummary } from "../lib/api.js";

interface UsersPageProps {
  users?: UserSummary[];
}

export function UsersPage({ users = userListPreview }: UsersPageProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">用户管理</p>
          <h3>商家 / 创作者 / 运营账号</h3>
        </div>
      </div>
      {users.map((user) => (
        <article key={user.id} className="list-row">
          <div>
            <strong>{user.name}</strong>
            <p>
              {user.role} · {user.note}
            </p>
          </div>
          <span className="status-pill reviewing">{user.health}</span>
        </article>
      ))}
    </section>
  );
}
