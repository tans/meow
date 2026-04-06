import type { ReactNode } from "react";
import type { BuyerNavId } from "./Sidebar.js";
import { Header } from "./Header.js";
import { Sidebar } from "./Sidebar.js";

interface BuyerLayoutProps {
  children: ReactNode;
  currentId?: BuyerNavId;
  onNavigate?: (id: BuyerNavId) => void;
  title?: string;
  subtitle?: string;
  userName?: string;
}

export function BuyerLayout({
  children,
  currentId = "dashboard",
  onNavigate = () => undefined,
  title = "商家工作台",
  subtitle = "集中查看预算、投稿进度和结算状态。",
  userName,
}: BuyerLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <Sidebar currentId={currentId} onNavigate={onNavigate} />
      <main className="flex-1 p-6">
        <Header title={title} subtitle={subtitle} userName={userName} />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
