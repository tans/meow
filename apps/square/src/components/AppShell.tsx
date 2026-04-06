import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-5">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header Card */}
        <Card className="border-border/60 bg-card/95 backdrop-blur-xl shadow-lg shadow-foreground/5 animate-fade-in-up opacity-0">
          <CardHeader className="pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Badge
                  variant="secondary"
                  className={`
                    mb-3 text-xs font-semibold tracking-wide uppercase
                    ${session.activeRole === "creator"
                      ? "bg-primary/8 text-primary border-primary/20"
                      : "bg-accent/10 text-accent border-accent/30"
                    }
                  `}
                >
                  {session.activeRole === "creator" ? "创作者" : "需求方"}
                </Badge>
                <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {session.user.displayName}
                </CardTitle>
                <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
              <Badge variant="outline" className="border-border/60 text-xs font-medium text-muted-foreground">
                当前身份 · {session.activeRole}
              </Badge>
              <Badge variant="outline" className="border-border/60 text-xs font-medium text-muted-foreground">
                可切换身份 · {session.roles.join(" / ")}
              </Badge>
            </div>
            {switchingRole && (
              <p className="mt-3 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-sm text-primary/80 font-medium animate-fade-in">
                正在同步角色视图...
              </p>
            )}
            {statusMessage && (
              <p className="mt-3 rounded-xl bg-destructive/5 border border-destructive/10 px-4 py-3 text-sm text-destructive font-medium animate-fade-in">
                {statusMessage}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Navigation */}
        <nav className="flex gap-2.5 overflow-x-auto pb-2 px-1" aria-label="User navigation">
          {navItems.map((item, index) => (
            <Badge
              key={item}
              variant="outline"
              className="cursor-pointer whitespace-nowrap border-border/60 bg-card/80 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {item}
            </Badge>
          ))}
        </nav>

        {/* Main Content */}
        <main className="animate-fade-in-up opacity-0 stagger-2">
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
