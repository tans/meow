import type { ReactNode } from "react";
import type { AdminNavId } from "./Sidebar.js";
import { Header } from "./Header.js";
import { Sidebar } from "./Sidebar.js";

interface AdminLayoutProps {
  children: ReactNode;
  currentId?: AdminNavId;
  onNavigate?: (id: AdminNavId) => void;
  title?: string;
  subtitle?: string;
}

export function AdminLayout({
  children,
  currentId = "dashboard",
  onNavigate = () => undefined,
  title = "运营总控台",
  subtitle = "面向任务、资金和风控的统一后台。"
}: AdminLayoutProps) {
  return (
    <div className="admin-shell">
      <Sidebar currentId={currentId} onNavigate={onNavigate} />
      <main className="admin-main">
        <Header title={title} subtitle={subtitle} />
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
