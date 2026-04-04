import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type AdminNavId = "dashboard" | "users" | "tasks" | "ledger" | "settings";

export const adminNavItems: Array<{ id: AdminNavId; label: string; hint: string }> = [
  { id: "dashboard", label: "系统总览", hint: "看板与告警" },
  { id: "users", label: "用户管理", hint: "商家与创作者" },
  { id: "tasks", label: "任务管理", hint: "发布与审核" },
  { id: "ledger", label: "资金管理", hint: "托管与退款" },
  { id: "settings", label: "系统设置", hint: "规则与配置" },
];

interface SidebarProps {
  currentId: AdminNavId;
  onNavigate: (id: AdminNavId) => void;
}

export function Sidebar({ currentId, onNavigate }: SidebarProps) {
  return (
    <Card className="h-full min-h-[600px] w-64 border-[rgba(55,111,199,0.16)] bg-white/90 shadow-[0_12px_30px_rgba(48,98,176,0.12)]">
      <div className="p-6">
        {/* Logo Section */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#327bff] to-[#6ec1ff] text-xl font-bold text-white">
            喵
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6882a3]">
              Meow Operator
            </p>
            <h1 className="text-lg font-medium tracking-tight text-[#183153]">
              创意喵后台
            </h1>
          </div>
        </div>

        <Separator className="mb-4 bg-[rgba(55,111,199,0.16)]" />

        {/* Navigation */}
        <nav aria-label="Admin navigation">
          {adminNavItems.map((item) => (
            <Button
              key={item.id}
              variant={item.id === currentId ? "default" : "ghost"}
              className={`mb-2 h-auto w-full justify-start rounded-2xl p-3 text-left ${
                item.id === currentId
                  ? "bg-gradient-to-br from-[#2f7cf6] to-[#1f64d1] text-white shadow-[0_14px_28px_rgba(47,124,246,0.24)]"
                  : "text-[#183153] hover:bg-[#eff6ff]"
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{item.label}</span>
                <span className={`text-xs ${
                  item.id === currentId ? "text-white/80" : "text-[#6882a3]"
                }`}>
                  {item.hint}
                </span>
              </div>
            </Button>
          ))}
        </nav>
      </div>
    </Card>
  );
}
