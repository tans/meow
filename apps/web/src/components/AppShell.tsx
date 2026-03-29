import type { WebSession } from "../lib/session.js";
import { CreatorHomePage } from "../routes/CreatorHomePage.js";
import { MerchantTasksPage } from "../routes/MerchantTasksPage.js";

const creatorNavItems = ["悬赏大厅", "获奖作品", "我的"];
const merchantNavItems = ["任务管理", "发布任务", "稿件审核", "我的"];

interface AppShellProps {
  session: WebSession;
}

export function AppShell({ session }: AppShellProps) {
  const navItems =
    session.role === "creator" ? creatorNavItems : merchantNavItems;

  return (
    <div>
      <nav aria-label="主导航">
        <ul>
          {navItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </nav>
      <main>
        {session.role === "creator" ? <CreatorHomePage /> : <MerchantTasksPage />}
      </main>
    </div>
  );
}
