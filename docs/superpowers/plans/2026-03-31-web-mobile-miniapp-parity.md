# Web Mobile Miniapp Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `apps/web` into a blue-white, mobile-width browser shell that preserves the extra Web login step and then mirrors the existing mini program creator and merchant flows page-for-page.

**Architecture:** Add client-side routing to `apps/web`, keep session bootstrap and API access in `src/lib`, and split the UI into a small set of shell components plus page components that map directly to mini program routes. Reuse the existing API routes from `apps/api`, add read-model mapping helpers in `src/lib/models.ts`, and drive parity through route-focused Vitest tests before implementation.

**Tech Stack:** React 18, Vite, Vitest, `@testing-library/react`, `react-router-dom`, existing `@meow/contracts` and `apps/api` HTTP endpoints

---

## File Structure

### Existing files to modify

- `apps/web/package.json`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/models.ts`
- `apps/web/src/lib/session.ts`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/RoleSwitch.tsx`
- `apps/web/src/components/TaskCard.tsx`
- `apps/web/src/routes/LoginPage.tsx`
- `apps/web/src/routes/CreatorHomePage.tsx`
- `apps/web/src/routes/MerchantTasksPage.tsx`
- `apps/web/src/routes/TaskDetailPage.tsx`
- `apps/web/src/routes/SubmissionEditorPage.tsx`
- `apps/web/src/routes/WalletPage.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/tests/app-shell.test.tsx`
- `apps/web/src/tests/task-flow.test.tsx`
- `apps/web/src/tests/web-styles.test.tsx`

### New files to create

- `apps/web/src/components/MobileShell.tsx`
- `apps/web/src/components/TopBar.tsx`
- `apps/web/src/components/BottomTabBar.tsx`
- `apps/web/src/routes/AwardsPage.tsx`
- `apps/web/src/routes/ProfilePage.tsx`
- `apps/web/src/routes/CreatorTaskFeedPage.tsx`
- `apps/web/src/routes/CreatorTaskDetailPage.tsx`
- `apps/web/src/routes/CreatorEarningsPage.tsx`
- `apps/web/src/routes/MerchantTaskCreatePage.tsx`
- `apps/web/src/routes/MerchantTaskDetailPage.tsx`
- `apps/web/src/routes/MerchantReviewPage.tsx`
- `apps/web/src/routes/MerchantSettlementPage.tsx`
- `apps/web/src/tests/web-routing.test.tsx`
- `apps/web/src/tests/creator-pages.test.tsx`
- `apps/web/src/tests/merchant-pages.test.tsx`

### Responsibility map

- `src/App.tsx` owns session bootstrap, login submission, role switching, and route guards.
- `src/lib/api.ts` owns fetch wrappers for auth, creator, merchant, submission, and wallet endpoints.
- `src/lib/models.ts` owns page-level read models derived from API payloads and mini program copy.
- `src/components/MobileShell.tsx` owns the phone-width container, top bar, page scroll area, and bottom tab mounting.
- `src/components/TopBar.tsx` owns the back button and current page title for non-tab pages.
- `src/components/BottomTabBar.tsx` owns the creator tab bar for `/tasks`, `/workspace`, and `/profile`.
- `src/routes/*Page.tsx` files each own a single mini program page surface.
- `src/styles.css` owns the blue-white visual system and the mobile container styles.
- `src/tests/web-routing.test.tsx` locks route guard and navigation behavior.
- `src/tests/creator-pages.test.tsx` locks creator page structure and interactions.
- `src/tests/merchant-pages.test.tsx` locks merchant page structure and interactions.

### Safety note

The worktree already contains unrelated edits and local SQLite files. In every commit step below, stage only the listed `apps/web` files. Do not run `git add .`.

---

### Task 1: Add Browser Routing and the Mobile Shell

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/session.ts`
- Modify: `apps/web/src/tests/app-shell.test.tsx`
- Create: `apps/web/src/components/MobileShell.tsx`
- Create: `apps/web/src/components/TopBar.tsx`
- Create: `apps/web/src/components/BottomTabBar.tsx`
- Create: `apps/web/src/tests/web-routing.test.tsx`

- [ ] **Step 1: Write the failing routing tests**

```tsx
// apps/web/src/tests/web-routing.test.tsx
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App, { type WebSession } from "../App.js";

const creatorSession: WebSession = {
  user: { id: "hybrid-1", displayName: "Demo Hybrid" },
  activeRole: "creator",
  roles: ["creator", "merchant"]
};

describe("web routing", () => {
  it("redirects creator root to the miniapp tasks tab", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App session={creatorSession} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "悬赏大厅" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "悬赏大厅" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("shows login when no session exists", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "登录创意喵" })).toBeTruthy();
  });

  it("moves a merchant session to the merchant entry route", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App
          session={{
            user: { id: "merchant-1", displayName: "Demo Merchant" },
            activeRole: "merchant",
            roles: ["merchant", "creator"]
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "发布任务" })).toBeTruthy();
  });
});
```

```tsx
// apps/web/src/tests/app-shell.test.tsx
import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App, { type WebSession } from "../App.js";

afterEach(() => cleanup());

describe("App shell contract", () => {
  it("renders creator tabs inside the mobile shell", () => {
    const creatorSession: WebSession = {
      user: { id: "creator-1", displayName: "Demo Creator" },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App session={creatorSession} />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation", { name: "Creator tabs" })).toBeTruthy();
    expect(screen.getByText("Demo Creator")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @meow/web test -- web-routing.test.tsx app-shell.test.tsx
```

Expected: FAIL because `react-router-dom` is not installed, `App` does not render route-aware shells, and no creator tabs exist yet.

- [ ] **Step 3: Add routing dependency and mount the router**

```json
// apps/web/package.json
{
  "dependencies": {
    "@meow/contracts": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1"
  }
}
```

```tsx
// apps/web/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("web root container not found");
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App bootstrapSession />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 4: Implement the mobile shell primitives and route-aware app**

```tsx
// apps/web/src/components/BottomTabBar.tsx
import { NavLink } from "react-router-dom";

const creatorTabs = [
  { to: "/tasks", label: "悬赏大厅" },
  { to: "/workspace", label: "获奖作品" },
  { to: "/profile", label: "我的" }
];

export function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar" aria-label="Creator tabs">
      {creatorTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          role="tab"
          className={({ isActive }) =>
            isActive ? "bottom-tab bottom-tab--active" : "bottom-tab"
          }
          aria-selected={({ isActive }: { isActive: boolean }) =>
            isActive ? "true" : "false"
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

```tsx
// apps/web/src/components/MobileShell.tsx
import type { PropsWithChildren, ReactNode } from "react";

export function MobileShell({
  header,
  tabs,
  children
}: PropsWithChildren<{ header?: ReactNode; tabs?: ReactNode }>) {
  return (
    <div className="mobile-app">
      <div className="mobile-device">
        {header ? <div className="mobile-top">{header}</div> : null}
        <main className="mobile-content">{children}</main>
        {tabs ? <div className="mobile-bottom">{tabs}</div> : null}
      </div>
    </div>
  );
}
```

```tsx
// apps/web/src/App.tsx
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { MobileShell } from "./components/MobileShell.js";
import { BottomTabBar } from "./components/BottomTabBar.js";
import { TopBar } from "./components/TopBar.js";
import { CreatorHomePage } from "./routes/CreatorHomePage.js";
import { LoginPage } from "./routes/LoginPage.js";
import { MerchantTaskCreatePage } from "./routes/MerchantTaskCreatePage.js";

const creatorTabPaths = new Set(["/tasks", "/workspace", "/profile"]);

const defaultPathForRole = (role: WebRole) =>
  role === "merchant" ? "/merchant/task-create" : "/tasks";

// Inside App()
const location = useLocation();
const navigate = useNavigate();

if (!currentSession) {
  return <LoginPage loading={loading} errorMessage={statusMessage} onSubmit={handleLogin} />;
}

if (
  currentSession.activeRole === "merchant" &&
  creatorTabPaths.has(location.pathname)
) {
  return <Navigate to="/merchant/task-create" replace />;
}

return (
  <Routes>
    <Route path="/" element={<Navigate to={defaultPathForRole(currentSession.activeRole)} replace />} />
    <Route
      path="/tasks"
      element={
        <MobileShell tabs={<BottomTabBar />}>
          <CreatorHomePage tasks={creatorTasks} />
        </MobileShell>
      }
    />
    <Route
      path="/merchant/task-create"
      element={
        <MobileShell header={<TopBar title="发布任务" onBack={() => navigate(-1)} />}>
          <MerchantTaskCreatePage />
        </MobileShell>
      }
    />
  </Routes>
);
```

- [ ] **Step 5: Run the routing tests and typecheck**

Run:

```bash
pnpm --filter @meow/web test -- web-routing.test.tsx app-shell.test.tsx
pnpm --filter @meow/web typecheck
```

Expected: PASS. The creator root renders the mobile shell and tabs, unauthenticated routes show login, and merchant sessions redirect away from creator tab routes.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/src/main.tsx apps/web/src/App.tsx apps/web/src/lib/session.ts apps/web/src/components/MobileShell.tsx apps/web/src/components/TopBar.tsx apps/web/src/components/BottomTabBar.tsx apps/web/src/tests/app-shell.test.tsx apps/web/src/tests/web-routing.test.tsx
git commit -m "feat: add web mobile routing shell"
```

---

### Task 2: Build Creator Pages and Read Models

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/lib/models.ts`
- Modify: `apps/web/src/routes/CreatorHomePage.tsx`
- Modify: `apps/web/src/routes/TaskDetailPage.tsx`
- Modify: `apps/web/src/routes/SubmissionEditorPage.tsx`
- Modify: `apps/web/src/routes/WalletPage.tsx`
- Modify: `apps/web/src/tests/task-flow.test.tsx`
- Create: `apps/web/src/routes/AwardsPage.tsx`
- Create: `apps/web/src/routes/ProfilePage.tsx`
- Create: `apps/web/src/routes/CreatorTaskFeedPage.tsx`
- Create: `apps/web/src/routes/CreatorTaskDetailPage.tsx`
- Create: `apps/web/src/routes/CreatorEarningsPage.tsx`
- Create: `apps/web/src/tests/creator-pages.test.tsx`

- [ ] **Step 1: Write the failing creator page tests**

```tsx
// apps/web/src/tests/creator-pages.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CreatorTaskDetailPage } from "../routes/CreatorTaskDetailPage.js";
import { ProfilePage } from "../routes/ProfilePage.js";

describe("creator pages", () => {
  it("renders the profile quick links and merchant entry", () => {
    render(<ProfilePage currentRole="creator" onEnterMerchant={vi.fn()} />);

    expect(screen.getByText("我的投稿")).toBeTruthy();
    expect(screen.getByText("收益明细")).toBeTruthy();
    expect(screen.getByRole("button", { name: "进入商家侧" })).toBeTruthy();
  });

  it("renders task detail actions and my submissions", () => {
    render(
      <MemoryRouter initialEntries={["/creator/task/task-1"]}>
        <Routes>
          <Route
            path="/creator/task/:taskId"
            element={
              <CreatorTaskDetailPage
                task={{
                  id: "task-1",
                  title: "春季短视频征稿",
                  status: "published",
                  rewardText: "基础奖 1 x 2 + 排名奖 1",
                  creatorSubmissionCount: 1,
                  canSubmit: true
                }}
                submissionCards={[
                  {
                    submissionId: "submission-1",
                    title: "第一版作品",
                    statusText: "待审核",
                    rewardTag: "待审核",
                    canEdit: true,
                    canWithdraw: true
                  }
                ]}
                onSubmitTap={vi.fn()}
                onEditTap={vi.fn()}
                onWithdrawTap={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "立即投稿" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "修改" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "撤回" })).toBeTruthy();
  });
});
```

```tsx
// apps/web/src/tests/task-flow.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorHomePage } from "../routes/CreatorHomePage.js";

describe("creator home page", () => {
  it("renders miniapp lobby copy and task cards", () => {
    render(
      <CreatorHomePage
        channels={["推荐", "品牌合作", "急单", "同城"]}
        activeChannel="推荐"
        tasks={[
          {
            id: "task-1",
            title: "春季穿搭口播征稿",
            brandName: "奈雪",
            summary: "到店拍摄 15 秒短视频",
            rewardText: "基础奖 1 x 2 + 排名奖 1",
            metaText: "126 人参与 · 距截止 3 天",
            highlightTag: "平台精选"
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "悬赏大厅" })).toBeTruthy();
    expect(screen.getByText("推荐")).toBeTruthy();
    expect(screen.getByText("平台精选")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @meow/web test -- creator-pages.test.tsx task-flow.test.tsx
```

Expected: FAIL because the creator page components and creator read-model props do not exist yet.

- [ ] **Step 3: Expand the fetch layer and creator read models**

```ts
// apps/web/src/lib/api.ts
export const getCreatorTaskDetail = async (taskId: string) =>
  parseJson<CreatorTaskDetailItem>(await fetch(`/creator/tasks/${taskId}`));

export const listCreatorTaskSubmissions = async (taskId: string) =>
  parseJson<CreatorSubmissionItem[]>(
    await fetch(`/creator/tasks/${taskId}/submissions`)
  );

export const listCreatorSubmissions = async () =>
  parseJson<CreatorSubmissionItem[]>(await fetch("/creator/submissions"));

export const createCreatorSubmission = async (
  taskId: string,
  input: { assetUrl: string; description: string }
) =>
  parseJson<CreatorSubmissionItem>(
    await fetch(`/creator/tasks/${taskId}/submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const updateCreatorSubmission = async (
  submissionId: string,
  input: { assetUrl: string; description: string }
) =>
  parseJson<CreatorSubmissionItem>(
    await fetch(`/creator/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const withdrawCreatorSubmission = async (submissionId: string) =>
  parseJson<{ id: string; status: string }>(
    await fetch(`/creator/submissions/${submissionId}/withdraw`, {
      method: "POST"
    })
  );

export const getCreatorWallet = async () =>
  parseJson<CreatorWalletSnapshot>(await fetch("/creator/wallet"));
```

```ts
// apps/web/src/lib/models.ts
export interface CreatorLobbyCardModel {
  id: string;
  title: string;
  brandName: string;
  summary: string;
  rewardText: string;
  metaText: string;
  highlightTag: string;
}

export const mapCreatorLobbyTasks = (tasks: CreatorTaskFeedItem[]): CreatorLobbyCardModel[] =>
  tasks.map((task) => ({
    id: task.id,
    title: resolveTaskTitle(task.id),
    brandName: resolveMerchantLabel(task.merchantId),
    summary: "查看任务详情与奖励规则",
    rewardText: "基础奖 1 x 2 + 排名奖 1",
    metaText: `${task.creatorSubmissionCount ?? 0} 人参与 · 开放征稿中`,
    highlightTag: task.status === "published" ? "新发布" : "已截止"
  }));
```

- [ ] **Step 4: Implement creator pages and wire them into routes**

```tsx
// apps/web/src/routes/ProfilePage.tsx
const quickLinks = [
  { label: "我的投稿", to: "/creator/task-feed" },
  { label: "收益明细", to: "/wallet" },
  { label: "草稿箱", to: "/creator/submission-edit" },
  { label: "合作记录", to: "/creator/earnings" }
];

export function ProfilePage({
  currentRole,
  onEnterMerchant
}: {
  currentRole: WebRole;
  onEnterMerchant: () => void;
}) {
  return (
    <section className="profile-page">
      <h1 className="page-title">我的</h1>
      <div className="quick-link-list">
        {quickLinks.map((item) => (
          <NavLink key={item.to} to={item.to} className="quick-link">
            <span>{item.label}</span>
            <span>查看</span>
          </NavLink>
        ))}
      </div>
      <button className="merchant-entry-button" type="button" onClick={onEnterMerchant}>
        进入商家侧
      </button>
    </section>
  );
}
```

```tsx
// apps/web/src/routes/CreatorTaskDetailPage.tsx
export function CreatorTaskDetailPage({
  task,
  submissionCards,
  onSubmitTap,
  onEditTap,
  onWithdrawTap
}: {
  task: CreatorTaskDetailModel | null;
  submissionCards: CreatorSubmissionCardModel[];
  onSubmitTap: () => void;
  onEditTap: (submissionId: string) => void;
  onWithdrawTap: (submissionId: string) => void;
}) {
  if (!task) {
    return <p className="native-empty">请先从任务池选择任务。</p>;
  }

  return (
    <section className="stack-page">
      <header className="card">
        <h1 className="page-title">任务详情</h1>
        <p className="page-subtitle">原生创作者页：查看任务要求并准备投稿。</p>
      </header>
      <section className="card">
        <h2 className="list-card__title">{task.title}</h2>
        <p className="list-card__meta">状态：{task.status}</p>
        <p className="list-card__meta">奖励：{task.rewardText}</p>
        <p className="list-card__meta">我的投稿：{task.creatorSubmissionCount}</p>
        {task.canSubmit ? (
          <button className="primary-button" type="button" onClick={onSubmitTap}>
            立即投稿
          </button>
        ) : (
          <p className="native-empty">当前任务不可投稿</p>
        )}
      </section>
    </section>
  );
}
```

```tsx
// apps/web/src/App.tsx
<Route
  path="/profile"
  element={
    <MobileShell tabs={<BottomTabBar />}>
      <ProfilePage
        currentRole={currentSession.activeRole}
        onEnterMerchant={() => void handleSwitchRoleAndNavigate("merchant", "/merchant/task-create")}
      />
    </MobileShell>
  }
/>
<Route
  path="/creator/task/:taskId"
  element={
    <MobileShell header={<TopBar title="任务详情" onBack={() => navigate(-1)} />}>
      <CreatorTaskDetailRoute />
    </MobileShell>
  }
/>
```

- [ ] **Step 5: Run the creator test suite**

Run:

```bash
pnpm --filter @meow/web test -- creator-pages.test.tsx task-flow.test.tsx web-routing.test.tsx
pnpm --filter @meow/web typecheck
```

Expected: PASS. Creator tab pages render mini program copy, detail pages show submit/edit/withdraw actions, and profile exposes quick links plus the merchant entry.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/lib/models.ts apps/web/src/routes/CreatorHomePage.tsx apps/web/src/routes/TaskDetailPage.tsx apps/web/src/routes/SubmissionEditorPage.tsx apps/web/src/routes/WalletPage.tsx apps/web/src/routes/AwardsPage.tsx apps/web/src/routes/ProfilePage.tsx apps/web/src/routes/CreatorTaskFeedPage.tsx apps/web/src/routes/CreatorTaskDetailPage.tsx apps/web/src/routes/CreatorEarningsPage.tsx apps/web/src/tests/task-flow.test.tsx apps/web/src/tests/creator-pages.test.tsx apps/web/src/App.tsx
git commit -m "feat: add creator miniapp parity pages"
```

---

### Task 3: Build Merchant Pages and Mutation Flows

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/lib/models.ts`
- Modify: `apps/web/src/routes/MerchantTasksPage.tsx`
- Modify: `apps/web/src/tests/task-flow.test.tsx`
- Create: `apps/web/src/routes/MerchantTaskCreatePage.tsx`
- Create: `apps/web/src/routes/MerchantTaskDetailPage.tsx`
- Create: `apps/web/src/routes/MerchantReviewPage.tsx`
- Create: `apps/web/src/routes/MerchantSettlementPage.tsx`
- Create: `apps/web/src/tests/merchant-pages.test.tsx`

- [ ] **Step 1: Write the failing merchant page tests**

```tsx
// apps/web/src/tests/merchant-pages.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MerchantTaskCreatePage } from "../routes/MerchantTaskCreatePage.js";
import { MerchantReviewPage } from "../routes/MerchantReviewPage.js";

describe("merchant pages", () => {
  it("updates the budget summary while editing the create form", () => {
    render(<MerchantTaskCreatePage onPublish={vi.fn()} publishing={false} />);

    fireEvent.change(screen.getByLabelText("基础奖金额"), {
      target: { value: "3" }
    });

    expect(screen.getByText("需锁定预算 ¥7")).toBeTruthy();
    expect(screen.getByRole("button", { name: "创建并发布任务" })).toBeTruthy();
  });

  it("renders approve, tip, and ranking actions for review cards", () => {
    render(
      <MerchantReviewPage
        task={{ title: "春季短视频征稿", rewardText: "基础奖 1 x 2 + 排名奖 1" }}
        cards={[
          {
            submissionId: "submission-1",
            creatorText: "创作者 creator-1",
            statusText: "待审核",
            rewardTag: "待审核",
            canApprove: true,
            canTip: true,
            canRanking: true
          }
        ]}
        onApprove={vi.fn()}
        onTip={vi.fn()}
        onRanking={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "通过" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "打赏" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "排名奖" })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @meow/web test -- merchant-pages.test.tsx task-flow.test.tsx
```

Expected: FAIL because the merchant page components and budget-summary logic do not exist yet.

- [ ] **Step 3: Expand merchant fetch wrappers and read models**

```ts
// apps/web/src/lib/api.ts
export const createMerchantTaskDraft = async () =>
  parseJson<{ taskId: string; status: string }>(
    await fetch("/merchant/tasks", { method: "POST" })
  );

export const publishMerchantTask = async (taskId: string) =>
  parseJson<MerchantPublishResponse>(
    await fetch(`/merchant/tasks/${taskId}/publish`, { method: "POST" })
  );

export const getMerchantTaskDetail = async (taskId: string) =>
  parseJson<MerchantTaskDetailItem>(await fetch(`/merchant/tasks/${taskId}`));

export const listMerchantTaskSubmissions = async (taskId: string) =>
  parseJson<MerchantSubmissionItem[]>(
    await fetch(`/merchant/tasks/${taskId}/submissions`)
  );

export const reviewMerchantSubmission = async (
  submissionId: string,
  decision: "approved" | "rejected" = "approved"
) =>
  parseJson<MerchantSubmissionItem>(
    await fetch(`/merchant/submissions/${submissionId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision })
    })
  );

export const tipMerchantSubmission = async (submissionId: string) =>
  parseJson<unknown>(await fetch(`/merchant/submissions/${submissionId}/tips`, { method: "POST" }));

export const addMerchantRankingReward = async (taskId: string, submissionId: string) =>
  parseJson<unknown>(
    await fetch(`/merchant/tasks/${taskId}/rewards/ranking`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submissionId })
    })
  );

export const settleMerchantTask = async (taskId: string) =>
  parseJson<{ taskId: string; creatorAvailableDelta: number; merchantRefundDelta: number }>(
    await fetch(`/merchant/tasks/${taskId}/settle`, { method: "POST" })
  );
```

```ts
// apps/web/src/lib/models.ts
export const buildBudgetSummary = (input: {
  baseAmount: number;
  baseCount: number;
  rankingTotal: number;
}) => ({
  lockedTotal: input.baseAmount * input.baseCount + input.rankingTotal
});
```

- [ ] **Step 4: Implement the merchant pages and route loaders**

```tsx
// apps/web/src/routes/MerchantTaskCreatePage.tsx
const [form, setForm] = useState({
  title: "春季短视频征稿",
  baseAmount: 1,
  baseCount: 2,
  rankingTotal: 1
});

const summary = buildBudgetSummary(form);

return (
  <section className="stack-page">
    <header className="card">
      <h1 className="page-title">发布任务</h1>
      <p className="page-subtitle">原生商家页：配置任务信息、奖励预算和投稿限制。</p>
    </header>
    <section className="card native-form">
      <label className="native-form__field">
        <span className="native-form__label">基础奖金额</span>
        <input
          aria-label="基础奖金额"
          className="native-form__input"
          value={form.baseAmount}
          onChange={(event) =>
            setForm((current) => ({ ...current, baseAmount: Number(event.target.value || 0) }))
          }
        />
      </label>
      <p className="pill">{`需锁定预算 ¥${summary.lockedTotal}`}</p>
      <button className="primary-button" type="button" onClick={() => void onPublish(form)}>
        {publishing ? "发布中..." : "创建并发布任务"}
      </button>
    </section>
  </section>
);
```

```tsx
// apps/web/src/routes/MerchantReviewPage.tsx
export function MerchantReviewPage({
  task,
  cards,
  onApprove,
  onTip,
  onRanking
}: MerchantReviewPageProps) {
  return (
    <section className="stack-page">
      <header className="card">
        <h1 className="page-title">稿件审核</h1>
        <p className="page-subtitle">原生商家页：审核稿件、通过后冻结基础奖。</p>
      </header>
      <section className="card">
        <h2 className="list-card__title">{task.title}</h2>
        <p className="list-card__meta">{task.rewardText}</p>
      </section>
      <section className="list-card">
        {cards.map((item) => (
          <div key={item.submissionId} className="list-card__row">
            <div>
              <p className="list-card__title">{item.creatorText}</p>
              <p className="list-card__meta">{`${item.statusText} · ${item.rewardTag}`}</p>
            </div>
            <div className="inline-actions">
              {item.canApprove ? <button type="button" onClick={() => onApprove(item.submissionId)}>通过</button> : null}
              {item.canTip ? <button type="button" onClick={() => onTip(item.submissionId)}>打赏</button> : null}
              {item.canRanking ? <button type="button" onClick={() => onRanking(item.submissionId)}>排名奖</button> : null}
            </div>
          </div>
        ))}
      </section>
    </section>
  );
}
```

```tsx
// apps/web/src/App.tsx
<Route
  path="/merchant/review/:taskId"
  element={
    <MobileShell header={<TopBar title="稿件审核" onBack={() => navigate(-1)} />}>
      <MerchantReviewRoute />
    </MobileShell>
  }
/>
<Route
  path="/merchant/settlement/:taskId"
  element={
    <MobileShell header={<TopBar title="任务结算" onBack={() => navigate(-1)} />}>
      <MerchantSettlementRoute />
    </MobileShell>
  }
/>
```

- [ ] **Step 5: Run the merchant test suite**

Run:

```bash
pnpm --filter @meow/web test -- merchant-pages.test.tsx task-flow.test.tsx web-routing.test.tsx
pnpm --filter @meow/web typecheck
```

Expected: PASS. Merchant create, detail, review, and settlement pages mirror mini program copy and actions.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/lib/models.ts apps/web/src/routes/MerchantTasksPage.tsx apps/web/src/routes/MerchantTaskCreatePage.tsx apps/web/src/routes/MerchantTaskDetailPage.tsx apps/web/src/routes/MerchantReviewPage.tsx apps/web/src/routes/MerchantSettlementPage.tsx apps/web/src/tests/task-flow.test.tsx apps/web/src/tests/merchant-pages.test.tsx apps/web/src/App.tsx
git commit -m "feat: add merchant miniapp parity pages"
```

---

### Task 4: Apply Blue-White Styling and Final Verification

**Files:**
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/routes/LoginPage.tsx`
- Modify: `apps/web/src/components/TaskCard.tsx`
- Modify: `apps/web/src/components/RoleSwitch.tsx`
- Modify: `apps/web/src/tests/web-styles.test.tsx`

- [ ] **Step 1: Write the failing style-structure assertions**

```tsx
// apps/web/src/tests/web-styles.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App, { type WebSession } from "../App.js";
import { LoginPage } from "../routes/LoginPage.js";

describe("web visual structure", () => {
  it("renders the login surface with blue-white classes", () => {
    const { container } = render(
      <LoginPage loading={false} onSubmit={vi.fn()} />
    );

    expect(container.firstElementChild?.classList.contains("login-screen")).toBe(true);
    expect(container.querySelector(".login-panel--blue")).toBeTruthy();
    expect(screen.getByRole("button", { name: "进入创意喵" })).toHaveClass("primary-button");
  });

  it("renders creator tabs inside the mobile device frame", () => {
    const session: WebSession = {
      user: { id: "hybrid-1", displayName: "Demo Hybrid" },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App session={session} />
      </MemoryRouter>
    );

    expect(document.querySelector(".mobile-device")).toBeTruthy();
    expect(document.querySelector(".bottom-tab-bar")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "悬赏大厅" })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @meow/web test -- web-styles.test.tsx
```

Expected: FAIL because the blue-white mobile classes and bottom tab bar classes are not implemented yet.

- [ ] **Step 3: Replace the warm editorial styling with the blue-white mobile system**

```css
/* apps/web/src/styles.css */
:root {
  --bg: #eef4ff;
  --bg-strong: #dce9ff;
  --panel: #ffffff;
  --line: rgba(54, 104, 196, 0.14);
  --text: #183153;
  --muted: #5e7698;
  --accent: #2f80ff;
  --accent-strong: #1e63d7;
  --accent-soft: #e8f1ff;
  --success: #19a76f;
  --danger: #dd5b75;
  font-family: "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
}

body {
  margin: 0;
  color: var(--text);
  background:
    radial-gradient(circle at top, rgba(47, 128, 255, 0.18), transparent 32%),
    linear-gradient(180deg, #f7fbff 0%, var(--bg) 100%);
}

.mobile-app {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 12px;
}

.mobile-device {
  width: min(100%, 420px);
  min-height: 820px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border: 1px solid var(--line);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 64px rgba(50, 93, 170, 0.18);
  overflow: hidden;
}

.bottom-tab-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 14px 16px 18px;
  background: rgba(255, 255, 255, 0.96);
}
```

```tsx
// apps/web/src/routes/LoginPage.tsx
<section className="login-screen">
  <div className="login-panel login-panel--blue">
    <div className="login-aside">
      <p className="login-kicker">Miniapp Parity</p>
      <h1 className="login-title">登录创意喵</h1>
      <p className="login-lead">
        登录后直接进入与小程序一致的移动业务壳，按同样的页面顺序完成创作与商家流程。
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Run the full web verification suite**

Run:

```bash
pnpm --filter @meow/web test -- web-routing.test.tsx creator-pages.test.tsx merchant-pages.test.tsx web-styles.test.tsx login-page.test.tsx role-switch.test.tsx task-flow.test.tsx app-shell.test.tsx
pnpm --filter @meow/web build
pnpm --filter @meow/web typecheck
```

Expected: PASS. The Web app has route parity, creator and merchant flows, and blue-white mobile styling.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/styles.css apps/web/src/routes/LoginPage.tsx apps/web/src/components/TaskCard.tsx apps/web/src/components/RoleSwitch.tsx apps/web/src/tests/web-styles.test.tsx
git commit -m "feat: restyle web app for miniapp parity"
```

---

## Self-Review

### Spec coverage

- Web login retained: Task 1 and Task 4
- Mobile-width shell and route mapping: Task 1
- Creator pages and flows: Task 2
- Merchant pages and flows: Task 3
- Blue-white visual system: Task 4
- URL/back/refresh browser behavior: Task 1
- “Only record optimizations” rule: preserved by keeping the plan scoped to parity work only

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” markers remain.
- Each task includes explicit files, commands, and code snippets.
- Each verification step names concrete commands and expected outcomes.

### Type consistency

- Route components use `Creator*` and `Merchant*` names consistently.
- API wrapper names mirror the existing `apps/api` routes.
- Shell components remain separate from page components, matching the file structure above.
