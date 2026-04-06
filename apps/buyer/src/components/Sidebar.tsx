import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type BuyerNavId = "dashboard" | "tasks" | "wallet" | "settings";

export const buyerNavItems: Array<{ id: BuyerNavId; label: string; hint: string }> = [
  { id: "dashboard", label: "工作台", hint: "看板与动态" },
  { id: "tasks", label: "需求管理", hint: "发布与审核" },
  { id: "wallet", label: "资金中心", hint: "托管与退款" },
  { id: "settings", label: "账户设置", hint: "信息与偏好" },
];

interface SidebarProps {
  currentId: BuyerNavId;
  onNavigate: (id: BuyerNavId) => void;
}

export function Sidebar({ currentId, onNavigate }: SidebarProps) {
  return (
    <Card className="h-full min-h-[600px] w-64 border-[rgba(55,111,199,0.16)] bg-white/90 shadow-[0_12px_30px_rgba(48,98,176,0.12)]">
      <div className="p-6">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#ff6b35] to-[#ff9a5a] text-xl font-bold text-white">
            商
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6882a3]">
              Meow Buyer
            </p>
            <h1 className="text-lg font-medium tracking-tight text-[#183153]">
              创意喵商家端
            </h1>
          </div>
        </div>

        <Separator className="mb-4 bg-[rgba(55,111,199,0.16)]" />

        <nav aria-label="Buyer navigation">
          {buyerNavItems.map((item) => (
            <Button
              key={item.id}
              variant={item.id === currentId ? "default" : "ghost"}
              className={`mb-2 h-auto w-full justify-start rounded-2xl p-3 text-left ${
                item.id === currentId
                  ? "bg-gradient-to-br from-[#ff6b35] to-[#e85d2d] text-white shadow-[0_14px_28px_rgba(255,107,53,0.24)]"
                  : "text-[#183153] hover:bg-[#fff0eb]"
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{item.label}</span>
                <span
                  className={`text-xs ${
                    item.id === currentId ? "text-white/80" : "text-[#6882a3]"
                  }`}
                >
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
