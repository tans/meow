import { CreatorHomePage } from "../routes/CreatorHomePage.js";
import { MerchantTasksPage } from "../routes/MerchantTasksPage.js";
import type {
  CreatorTaskCardModel,
  MerchantTaskCardModel
} from "../lib/models.js";
import type { WebRole, WebSession } from "../lib/session.js";
import { RoleSwitch } from "./RoleSwitch.js";

const creatorNavItems = ["悬赏大厅", "获奖作品", "我的"];
const merchantNavItems = ["需求管理", "发布需求", "稿件审核", "我的"];

interface AppShellProps {
  session: WebSession;
  creatorTasks?: CreatorTaskCardModel[];
  merchantTasks?: MerchantTaskCardModel[];
  statusMessage?: string;
  switchingRole: boolean;
  onSwitchRole: (role: WebRole) => void;
}

export function AppShell({
  session,
  creatorTasks = [],
  merchantTasks = [],
  statusMessage,
  switchingRole,
  onSwitchRole
}: AppShellProps) {
  const navItems =
    session.activeRole === "creator" ? creatorNavItems : merchantNavItems;

  return (
    <div className="app-shell">
      <div className="shell-frame">
        <header className="shell-header">
          <div className="shell-header-top">
            <div>
              <p className="shell-kicker">{session.user.displayName}</p>
              <h1 className="shell-title">
                {session.activeRole === "creator" ? "创作者工作台" : "需求方工作台"}
              </h1>
              <p className="shell-subtitle">
                {session.activeRole === "creator"
                  ? "任务发现、投稿管理和收益回看集中在同一个浏览器工作台。"
                  : "把发布需求、审稿推进和结算节奏压缩到同一条移动链路。"}
              </p>
            </div>
            <RoleSwitch
              roles={session.roles}
              activeRole={session.activeRole}
              onSwitch={onSwitchRole}
            />
          </div>
          <div className="shell-meta">
            <span className="meta-pill">{`当前身份 · ${session.activeRole}`}</span>
            <span className="meta-pill">{`可切换身份 · ${session.roles.join(" / ")}`}</span>
          </div>
          {switchingRole ? (
            <p className="status-message">正在同步角色视图...</p>
          ) : null}
          {statusMessage ? <p className="error-message">{statusMessage}</p> : null}
        </header>
        <nav className="shell-nav" aria-label="User navigation">
          <ul className="shell-nav-list">
            {navItems.map((item) => (
              <li key={item} className="shell-nav-item">
                {item}
              </li>
            ))}
          </ul>
        </nav>
        <main className="shell-main">
        {session.activeRole === "creator" ? (
          <CreatorHomePage tasks={creatorTasks} />
        ) : (
          <MerchantTasksPage tasks={merchantTasks} />
        )}
        </main>
      </div>
    </div>
  );
}
