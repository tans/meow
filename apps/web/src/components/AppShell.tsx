import { CreatorHomePage } from "../routes/CreatorHomePage.js";
import { MerchantTasksPage } from "../routes/MerchantTasksPage.js";
import type {
  CreatorTaskCardModel,
  MerchantTaskCardModel
} from "../lib/models.js";
import type { WebRole, WebSession } from "../lib/session.js";
import { RoleSwitch } from "./RoleSwitch.js";

const creatorNavItems = ["悬赏大厅", "获奖作品", "我的"];
const merchantNavItems = ["任务管理", "发布任务", "稿件审核", "我的"];

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
    <div>
      <header>
        <p>{session.user.displayName}</p>
        <h1>
          {session.activeRole === "creator" ? "创作者工作台" : "商家工作台"}
        </h1>
        <RoleSwitch
          roles={session.roles}
          activeRole={session.activeRole}
          onSwitch={onSwitchRole}
        />
        {switchingRole ? <p>正在同步角色视图...</p> : null}
        {statusMessage ? <p>{statusMessage}</p> : null}
      </header>
      <nav aria-label="User navigation">
        <ul>
          {navItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </nav>
      <main>
        {session.activeRole === "creator" ? (
          <CreatorHomePage tasks={creatorTasks} />
        ) : (
          <MerchantTasksPage tasks={merchantTasks} />
        )}
      </main>
    </div>
  );
}
