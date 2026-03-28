import { useState } from "react";
import { AdminLayout } from "./components/AdminLayout.js";
import type { AdminNavId } from "./components/Sidebar.js";
import {
  settingsPreview,
  taskDetailPreview,
  taskListPreview
} from "./lib/api.js";
import { DashboardPage } from "./routes/DashboardPage.js";
import { LedgerPage } from "./routes/LedgerPage.js";
import { TaskDetailPage } from "./routes/TaskDetailPage.js";
import { TasksPage } from "./routes/TasksPage.js";
import { UsersPage } from "./routes/UsersPage.js";

type AdminView = AdminNavId | "task-detail";

const viewMeta: Record<AdminView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "系统总览",
    subtitle: "集中查看运营告警、结算节奏和风控状态。"
  },
  users: {
    title: "用户管理",
    subtitle: "统一管理商家、创作者和运营账号状态。"
  },
  tasks: {
    title: "任务管理",
    subtitle: "围绕发布、审核、评奖和结算的主链工作台。"
  },
  "task-detail": {
    title: "任务详情",
    subtitle: "查看奖励计划、稿件审核和结算准备状态。"
  },
  ledger: {
    title: "资金管理",
    subtitle: "跟踪预算托管、冻结收益和退款流水。"
  },
  settings: {
    title: "系统设置",
    subtitle: "沉淀系统职责与资金规则，供运营统一配置。"
  }
};

const appStyles = `
:root {
  color-scheme: light;
  --bg: #eef4fb;
  --bg-strong: #dfe9f8;
  --panel: rgba(255, 255, 255, 0.82);
  --panel-strong: #ffffff;
  --line: rgba(43, 72, 117, 0.12);
  --text: #14213d;
  --muted: #5f6f8a;
  --primary: #4f8ef7;
  --primary-dark: #2b7de9;
  --accent: #ff7b43;
  --success: #1f9d6b;
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
  --shadow: 0 18px 40px rgba(47, 79, 124, 0.14);
  font-family: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(79, 142, 247, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 123, 67, 0.16), transparent 22%),
    linear-gradient(180deg, #f7fbff 0%, var(--bg) 100%);
  color: var(--text);
}

button {
  font: inherit;
}

.admin-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  padding: 28px 22px;
  border-right: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(20px);
}

.sidebar-logo {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 28px;
}

.sidebar-logo-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), #7d7df6);
  color: white;
  font-size: 22px;
  font-weight: 700;
  box-shadow: var(--shadow);
}

.sidebar-eyebrow,
.card-kicker,
.header-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.sidebar-logo h1,
.header h2,
.section-heading h3,
.hero-card h3,
.panel h3 {
  margin: 0;
}

.sidebar-nav {
  display: grid;
  gap: 10px;
}

.sidebar-item {
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  text-align: left;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.sidebar-item:hover,
.sidebar-item.active {
  transform: translateX(3px);
  background: linear-gradient(135deg, rgba(79, 142, 247, 0.14), rgba(255, 123, 67, 0.1));
  border-color: rgba(79, 142, 247, 0.2);
}

.sidebar-item span,
.sidebar-item small {
  display: block;
}

.sidebar-item small,
.header-subtitle,
.hero-card p,
.list-row p,
.metric-card span,
.panel p {
  color: var(--muted);
}

.admin-main {
  padding: 28px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 32px;
  margin-bottom: 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(230, 239, 251, 0.8));
  box-shadow: var(--shadow);
}

.header-actions {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.header-chip,
.amount-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.header-chip {
  background: rgba(79, 142, 247, 0.12);
  color: var(--primary-dark);
}

.header-chip.accent {
  background: rgba(255, 123, 67, 0.14);
  color: #c85e1d;
}

.admin-content,
.page-grid,
.metric-grid,
.stack {
  display: grid;
  gap: 18px;
}

.hero-card,
.panel {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.hero-card {
  background:
    linear-gradient(135deg, rgba(79, 142, 247, 0.14), rgba(255, 123, 67, 0.08)),
    var(--panel-strong);
}

.metric-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card strong {
  font-size: 32px;
  line-height: 1;
}

.section-heading,
.list-row,
.task-row,
.task-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-row,
.task-row {
  padding: 16px 18px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(79, 142, 247, 0.08);
}

.task-table {
  display: grid;
  gap: 12px;
}

.ghost-button {
  border: 1px solid rgba(79, 142, 247, 0.2);
  background: white;
  color: var(--primary-dark);
  border-radius: 999px;
  padding: 10px 14px;
  cursor: pointer;
}

.status-pill {
  background: rgba(79, 142, 247, 0.12);
  color: var(--primary-dark);
}

.status-pill.published {
  background: rgba(79, 142, 247, 0.12);
}

.status-pill.reviewing,
.status-pill.submitted {
  background: rgba(255, 184, 0, 0.16);
  color: #8a5b00;
}

.status-pill.settled,
.status-pill.approved {
  background: rgba(31, 157, 107, 0.14);
  color: var(--success);
}

.amount-pill {
  background: rgba(20, 33, 61, 0.06);
  color: var(--text);
}

@media (max-width: 1024px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .admin-main {
    padding: 16px;
  }

  .header,
  .section-heading,
  .list-row,
  .task-row,
  .task-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

function SettingsPanel() {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">系统设置</p>
          <h3>平台职责与资金规则</h3>
        </div>
      </div>
      {settingsPreview.responsibilities.map((item) => (
        <article key={item} className="list-row">
          <div>
            <strong>{item}</strong>
            <p>来自 admin-shell 基础职责清单</p>
          </div>
        </article>
      ))}
      {settingsPreview.finance.map((item) => (
        <article key={item} className="list-row">
          <div>
            <strong>{item}</strong>
            <p>来自资金域职责定义</p>
          </div>
        </article>
      ))}
    </section>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [selectedTaskId, setSelectedTaskId] = useState(taskDetailPreview.id);

  const meta = viewMeta[activeView];

  return (
    <>
      <style>{appStyles}</style>
      <AdminLayout
        currentId={activeView === "task-detail" ? "tasks" : activeView}
        onNavigate={(id) => setActiveView(id)}
        title={meta.title}
        subtitle={meta.subtitle}
      >
        {activeView === "dashboard" ? <DashboardPage /> : null}
        {activeView === "users" ? <UsersPage /> : null}
        {activeView === "tasks" ? (
          <TasksPage
            tasks={taskListPreview}
            onOpenTask={(taskId) => {
              setSelectedTaskId(taskId);
              setActiveView("task-detail");
            }}
          />
        ) : null}
        {activeView === "task-detail" ? (
          <TaskDetailPage
            task={{ ...taskDetailPreview, id: selectedTaskId }}
            onBack={() => setActiveView("tasks")}
          />
        ) : null}
        {activeView === "ledger" ? <LedgerPage /> : null}
        {activeView === "settings" ? <SettingsPanel /> : null}
      </AdminLayout>
    </>
  );
}
