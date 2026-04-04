import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreatorHomePage } from "../routes/CreatorHomePage.js";
import { MerchantTasksPage } from "../routes/MerchantTasksPage.js";
import type { CreatorTaskCardModel, MerchantTaskCardModel } from "../lib/models.js";
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
  onSwitchRole,
}: AppShellProps) {
  const navItems = session.activeRole === "creator" ? creatorNavItems : merchantNavItems;

  return (
    <div className="min-h-screen p-5">
      <div className="mx-auto max-w-[980px] space-y-4">
        {/* Header Card */}
        <Card className="border-[rgba(55,111,199,0.16)] bg-white/90 shadow-[0_12px_30px_rgba(48,98,176,0.12)]">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6882a3]">
                  {session.user.displayName}
                </p>
                <CardTitle className="text-4xl font-normal tracking-tight text-[#183153]">
                  {session.activeRole === "creator" ? "创作者工作台" : "需求方工作台"}
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-[#6882a3]">
                  {session.activeRole === "creator"
                    ? "任务发现、投稿管理和收益回看集中在同一个浏览器工作台。"
                    : "把发布需求、审稿推进和结算节奏压缩到同一条移动链路。"}
                </CardDescription>
              </div>
              <RoleSwitch
                roles={session.roles}
                activeRole={session.activeRole}
                onSwitch={onSwitchRole}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-[#dbe9ff] text-[#1f64d1]">
                当前身份 · {session.activeRole}
              </Badge>
              <Badge variant="secondary" className="bg-[#dbe9ff] text-[#1f64d1]">
                可切换身份 · {session.roles.join(" / ")}
              </Badge>
            </div>
            {switchingRole && (
              <p className="mt-3 rounded-2xl bg-[rgba(219,233,255,0.95)] px-4 py-3 text-sm text-[#225cae]">
                正在同步角色视图...
              </p>
            )}
            {statusMessage && (
              <p className="mt-3 rounded-2xl bg-[rgba(255,232,236,0.95)] px-4 py-3 text-sm text-[#b73f55]">
                {statusMessage}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Navigation */}
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="User navigation">
          {navItems.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="cursor-pointer whitespace-nowrap border-[rgba(84,137,214,0.14)] bg-white/80 px-4 py-2 text-xs font-bold text-[#6882a3] hover:bg-[#eff6ff]"
            >
              {item}
            </Badge>
          ))}
        </nav>

        {/* Main Content */}
        <main>
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
