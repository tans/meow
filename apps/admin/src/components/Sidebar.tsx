export type AdminNavId = "dashboard" | "users" | "tasks" | "ledger" | "settings";

export const adminNavItems: Array<{ id: AdminNavId; label: string; hint: string }> = [
  { id: "dashboard", label: "系统总览", hint: "看板与告警" },
  { id: "users", label: "用户管理", hint: "商家与创作者" },
  { id: "tasks", label: "任务管理", hint: "发布与审核" },
  { id: "ledger", label: "资金管理", hint: "托管与退款" },
  { id: "settings", label: "系统设置", hint: "规则与配置" }
];

interface SidebarProps {
  currentId: AdminNavId;
  onNavigate: (id: AdminNavId) => void;
}

export function Sidebar({ currentId, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">喵</div>
        <div>
          <p className="sidebar-eyebrow">Meow Operator</p>
          <h1>创意喵后台</h1>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Admin navigation">
        {adminNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === currentId ? "sidebar-item active" : "sidebar-item"}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.hint}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}
