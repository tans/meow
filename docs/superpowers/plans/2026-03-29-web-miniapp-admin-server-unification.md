# Web Miniapp Admin Server Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real three-surface Meow first release where Web, WeChat mini program, and operator admin all use one API, one SQLite-backed data model, one session system, and the existing merchant/creator task chain.

**Architecture:** Keep the repo as a monorepo orchestrator, add a new `apps/web` React/Vite application for end users, move `apps/api` from in-memory demo maps to repository-backed SQLite persistence in `packages/database`, and keep mini program/admin as thin clients on top of typed API read models. Authentication stays intentionally simple for v1, but it must still be a real session flow with role switching and audit logging.

**Tech Stack:** TypeScript, pnpm, Turbo, Hono, React 18, Vite, Vitest, native WeChat Mini Program JavaScript, SQLite, Drizzle ORM, better-sqlite3

---

## Scope Check

This spec spans several surfaces, but they are not independent projects. `apps/web`, `apps/wechat-miniapp`, `apps/admin`, and `apps/api` all depend on the same new auth/session model and shared persistence layer. Splitting into separate plans would create duplicated infrastructure work and conflicting session assumptions. This unified plan keeps the shared foundation first, then fans out to each surface.

## File Structure

### New files

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/index.html`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/session.ts`
- `apps/web/src/lib/models.ts`
- `apps/web/src/routes/LoginPage.tsx`
- `apps/web/src/routes/CreatorHomePage.tsx`
- `apps/web/src/routes/MerchantTasksPage.tsx`
- `apps/web/src/routes/TaskDetailPage.tsx`
- `apps/web/src/routes/SubmissionEditorPage.tsx`
- `apps/web/src/routes/WalletPage.tsx`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/RoleSwitch.tsx`
- `apps/web/src/components/TaskCard.tsx`
- `apps/web/src/tests/app-shell.test.tsx`
- `apps/web/src/tests/login-page.test.tsx`
- `apps/web/src/tests/role-switch.test.tsx`
- `apps/web/src/tests/task-flow.test.tsx`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/services/auth.ts`
- `apps/api/src/services/admin.ts`
- `apps/api/src/tests/auth-session.test.ts`
- `apps/api/src/tests/admin-actions.test.ts`
- `apps/admin/src/routes/LoginPage.tsx`
- `apps/admin/src/tests/admin-login.test.tsx`
- `packages/database/drizzle.config.ts`
- `packages/database/src/repository.ts`
- `packages/database/src/sqlite.ts`
- `packages/database/src/tests/session-schema.test.ts`
- `packages/database/src/tests/task-persistence.test.ts`

### Existing files to modify

- `package.json`
- `turbo.json`
- `README.md`
- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/index.ts`
- `apps/api/src/lib/db.ts`
- `apps/api/src/lib/session.ts`
- `apps/api/src/routes/creator.ts`
- `apps/api/src/routes/merchant.ts`
- `apps/api/src/services/tasks.ts`
- `apps/api/src/services/submissions.ts`
- `apps/api/src/services/rewards.ts`
- `apps/api/src/services/settlement.ts`
- `apps/api/src/services/wallet.ts`
- `apps/api/src/tests/creator-submission.test.ts`
- `apps/api/src/tests/merchant-publish.test.ts`
- `apps/api/src/tests/read-models.test.ts`
- `apps/api/src/tests/settlement.test.ts`
- `apps/admin/package.json`
- `apps/admin/src/App.tsx`
- `apps/admin/src/lib/api.ts`
- `apps/admin/src/routes/DashboardPage.tsx`
- `apps/admin/src/routes/TasksPage.tsx`
- `apps/admin/src/routes/TaskDetailPage.tsx`
- `apps/admin/src/routes/UsersPage.tsx`
- `apps/admin/src/routes/LedgerPage.tsx`
- `apps/admin/src/tests/dashboard-page.test.tsx`
- `apps/wechat-miniapp/src/services/http.js`
- `apps/wechat-miniapp/src/services/store.js`
- `apps/wechat-miniapp/src/services/tasks.js`
- `apps/wechat-miniapp/src/services/submissions.js`
- `apps/wechat-miniapp/src/services/wallet.js`
- `apps/wechat-miniapp/src/services/role.js`
- `apps/wechat-miniapp/src/tests/task-feed.test.js`
- `apps/wechat-miniapp/src/tests/task-detail.test.js`
- `apps/wechat-miniapp/src/tests/workspace.test.js`
- `apps/wechat-miniapp/miniprogram/app.js`
- `apps/wechat-miniapp/miniprogram/app.json`
- `packages/database/package.json`
- `packages/database/src/schema.ts`
- `packages/database/src/client.ts`
- `packages/database/src/seed.ts`
- `packages/database/src/test-db.ts`
- `packages/contracts/src/index.ts`

### Responsibility map

- `packages/database/src/schema.ts` owns the persisted entity definitions and enum lists.
- `packages/database/src/repository.ts` owns the SQLite-backed repository API consumed by `apps/api`.
- `apps/api/src/routes/auth.ts` owns login, logout, current session, and role switching HTTP endpoints.
- `apps/api/src/lib/session.ts` owns extracting a typed session from cookies/headers and enforcing role access.
- `apps/api/src/services/*.ts` own workflow rules only; they do not touch raw SQL directly.
- `apps/web/src/lib/session.ts` owns client-side session bootstrap and role switching state.
- `apps/web/src/components/AppShell.tsx` owns shared user-web layout and top-level navigation.
- `apps/wechat-miniapp/src/services/http.js` owns attaching session tokens and retrying bootstrap calls.
- `apps/admin/src/lib/api.ts` owns all operator-facing queries and actions against `/admin/*`.

### Repository note

`AGENTS.md` points to `RTK.md`, which prefers `rtk <command>`. In the current environment `rtk` is not installed, so commands below use raw binaries. If `rtk` becomes available, prefix the same commands with `rtk`.

---

### Task 1: Scaffold the User Web App and Lock the Shell Contract

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/lib/session.ts`
- Create: `apps/web/src/components/AppShell.tsx`
- Create: `apps/web/src/routes/LoginPage.tsx`
- Create: `apps/web/src/routes/CreatorHomePage.tsx`
- Create: `apps/web/src/routes/MerchantTasksPage.tsx`
- Create: `apps/web/src/tests/app-shell.test.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write the failing shell test for login gating and role-specific navigation**

```tsx
// apps/web/src/tests/app-shell.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App.js";

describe("web app shell", () => {
  it("shows login when there is no authenticated session", () => {
    render(
      <App
        initialSession={null}
        initialTasks={[]}
      />
    );

    expect(screen.getByRole("heading", { name: "登录创意喵" })).toBeInTheDocument();
    expect(screen.queryByText("悬赏大厅")).not.toBeInTheDocument();
  });

  it("shows the creator shell by default", () => {
    render(
      <App
        initialSession={{
          user: { id: "user-1", displayName: "阿喵创作社" },
          activeRole: "creator",
          roles: ["creator", "merchant"]
        }}
        initialTasks={[]}
      />
    );

    expect(screen.getByRole("navigation", { name: "User navigation" })).toBeInTheDocument();
    expect(screen.getByText("悬赏大厅")).toBeInTheDocument();
    expect(screen.getByText("获奖作品")).toBeInTheDocument();
    expect(screen.getByText("我的")).toBeInTheDocument();
  });

  it("switches the visible navigation when merchant is active", () => {
    render(
      <App
        initialSession={{
          user: { id: "user-1", displayName: "Demo Merchant" },
          activeRole: "merchant",
          roles: ["creator", "merchant"]
        }}
        initialTasks={[]}
      />
    );

    expect(screen.getByText("任务管理")).toBeInTheDocument();
    expect(screen.getByText("发布任务")).toBeInTheDocument();
    expect(screen.getByText("稿件审核")).toBeInTheDocument();
    expect(screen.queryByText("获奖作品")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the web test to verify the package does not exist yet**

Run:

```bash
pnpm --filter @meow/web test -- app-shell.test.tsx
```

Expected: FAIL with `No projects matched the filters` or missing `apps/web/package.json`.

- [ ] **Step 3: Add the minimal web package and shell implementation**

```json
// apps/web/package.json
{
  "name": "@meow/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -b tsconfig.json && vite build",
    "typecheck": "tsc -b tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "dev": "vite",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^26.1.0",
    "vite": "^6.2.0",
    "vitest": "^3.1.2"
  }
}
```

```tsx
// apps/web/src/App.tsx
import { AppShell } from "./components/AppShell.js";
import { LoginPage } from "./routes/LoginPage.js";

export interface WebSession {
  user: { id: string; displayName: string };
  activeRole: "creator" | "merchant";
  roles: Array<"creator" | "merchant">;
}

interface AppProps {
  initialSession: WebSession | null;
  initialTasks: Array<{ id: string; title: string }>;
}

export function App({ initialSession, initialTasks }: AppProps) {
  if (!initialSession) {
    return <LoginPage />;
  }

  return <AppShell session={initialSession} tasks={initialTasks} />;
}
```

```tsx
// apps/web/src/components/AppShell.tsx
import type { WebSession } from "../App.js";

interface AppShellProps {
  session: WebSession;
  tasks: Array<{ id: string; title: string }>;
}

const creatorNav = ["悬赏大厅", "获奖作品", "我的"];
const merchantNav = ["任务管理", "发布任务", "稿件审核", "我的"];

export function AppShell({ session }: AppShellProps) {
  const navItems = session.activeRole === "creator" ? creatorNav : merchantNav;

  return (
    <main>
      <header>
        <h1>创意喵</h1>
        <p>{session.user.displayName}</p>
      </header>
      <nav aria-label="User navigation">
        {navItems.map((item) => (
          <a key={item} href="#">
            {item}
          </a>
        ))}
      </nav>
    </main>
  );
}
```

```tsx
// apps/web/src/routes/LoginPage.tsx
export function LoginPage() {
  return (
    <main>
      <h1>登录创意喵</h1>
      <p>使用演示账号进入 Web 与小程序统一会话。</p>
    </main>
  );
}
```

```json
// package.json (append dependency script visibility only if missing)
{
  "scripts": {
    "smoke": "pnpm --filter @meow/api test && pnpm --filter @meow/admin build && pnpm --filter @meow/web build && pnpm --filter @meow/wechat-miniapp typecheck && pnpm harness"
  }
}
```

- [ ] **Step 4: Run the web test to verify the shell contract passes**

Run:

```bash
pnpm install
pnpm --filter @meow/web test -- app-shell.test.tsx
```

Expected: PASS with `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add package.json apps/web
git commit -m "feat: scaffold web user shell"
```

---

### Task 2: Replace the Demo Store with SQLite Repositories and Seeded Users

**Files:**
- Modify: `packages/database/package.json`
- Create: `packages/database/drizzle.config.ts`
- Modify: `packages/database/src/schema.ts`
- Modify: `packages/database/src/client.ts`
- Create: `packages/database/src/sqlite.ts`
- Create: `packages/database/src/repository.ts`
- Modify: `packages/database/src/seed.ts`
- Modify: `packages/database/src/test-db.ts`
- Create: `packages/database/src/tests/session-schema.test.ts`
- Create: `packages/database/src/tests/task-persistence.test.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/lib/db.ts`

- [ ] **Step 1: Write failing database tests for users, sessions, and task persistence**

```ts
// packages/database/src/tests/session-schema.test.ts
import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-db.js";

describe("session schema", () => {
  it("seeds users with multiple roles and creates a persisted session", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();
    const session = await db.repository.createSession({
      userId: seeded.hybridUser.id,
      activeRole: "creator",
      client: "web"
    });

    expect(seeded.hybridUser.roles).toEqual(["creator", "merchant"]);
    expect(session.userId).toBe(seeded.hybridUser.id);
    expect(session.activeRole).toBe("creator");
    expect(await db.repository.findSession(session.id)).toMatchObject({
      id: session.id,
      userId: seeded.hybridUser.id
    });
  });
});
```

```ts
// packages/database/src/tests/task-persistence.test.ts
import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-db.js";

describe("task persistence", () => {
  it("stores a published task, a submission, and a frozen reward in sqlite", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();
    const task = await db.repository.createTaskDraft({
      merchantId: seeded.hybridUser.id,
      title: "春季穿搭口播征稿"
    });
    await db.repository.publishTask(task.id, { escrowLockedAmount: 300 });
    const submission = await db.repository.createSubmission({
      taskId: task.id,
      creatorId: seeded.creatorUser.id,
      assetUrl: "https://example.com/demo.mp4",
      description: "demo"
    });
    await db.repository.createReward({
      taskId: task.id,
      submissionId: submission.id,
      creatorId: seeded.creatorUser.id,
      type: "base",
      amount: 100,
      status: "frozen"
    });

    expect(await db.repository.getTask(task.id)).toMatchObject({
      id: task.id,
      status: "published",
      escrowLockedAmount: 300
    });
    expect(await db.repository.listSubmissionsByTask(task.id)).toHaveLength(1);
    expect(await db.repository.listRewardsByCreator(seeded.creatorUser.id)).toEqual([
      expect.objectContaining({ type: "base", status: "frozen", amount: 100 })
    ]);
  });
});
```

- [ ] **Step 2: Run the database tests to verify the repository layer is missing**

Run:

```bash
pnpm --filter @meow/database test -- session-schema.test.ts task-persistence.test.ts
```

Expected: FAIL because `repository`, `createSession`, and persistent task methods do not exist.

- [ ] **Step 3: Add the SQLite-backed schema and repository API**

```json
// packages/database/package.json
{
  "exports": {
    ".": {
      "types": "./dist/client.d.ts",
      "default": "./dist/client.js"
    },
    "./sqlite": {
      "types": "./dist/sqlite.d.ts",
      "default": "./dist/sqlite.js"
    },
    "./repository": {
      "types": "./dist/repository.d.ts",
      "default": "./dist/repository.js"
    }
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "drizzle-orm": "^0.43.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.1"
  }
}
```

```ts
// packages/database/src/schema.ts
export const roleValues = ["creator", "merchant", "operator"] as const;
export const sessionClientValues = ["web", "miniapp", "admin"] as const;
export const operatorActionValues = [
  "pause-task",
  "resume-task",
  "ban-user",
  "unban-user",
  "mark-ledger-anomaly"
] as const;

export const taskStatuses = ["draft", "published", "paused", "ended", "settled", "closed"] as const;
export const submissionStatuses = ["submitted", "approved", "rejected", "withdrawn"] as const;
export const rewardTypes = ["base", "ranking", "tip"] as const;
export const rewardStatuses = ["frozen", "available", "cancelled"] as const;
```

```ts
// packages/database/src/repository.ts
export interface UserRecord {
  id: string;
  identifier: string;
  displayName: string;
  roles: Array<"creator" | "merchant" | "operator">;
}

export interface SessionRecord {
  id: string;
  userId: string;
  activeRole: "creator" | "merchant" | "operator";
  client: "web" | "miniapp" | "admin";
}

export interface DatabaseRepository {
  getUser(userId: string): Promise<UserRecord | null>;
  findUserByIdentifier(identifier: string): Promise<UserRecord | null>;
  createSession(input: {
    userId: string;
    activeRole: "creator" | "merchant" | "operator";
    client: "web" | "miniapp" | "admin";
  }): Promise<SessionRecord>;
  findSession(sessionId: string): Promise<SessionRecord | null>;
  switchSessionRole(
    sessionId: string,
    role: "creator" | "merchant" | "operator"
  ): Promise<SessionRecord>;
  createTaskDraft(input: {
    merchantId: string;
    title: string;
  }): Promise<{ id: string; merchantId: string; title: string; status: "draft"; escrowLockedAmount: number }>;
  listTasksByMerchant(merchantId: string): Promise<Array<{ id: string; merchantId: string; status: string }>>;
  publishTask(taskId: string, input: { escrowLockedAmount: number }): Promise<void>;
  getTask(taskId: string): Promise<{ id: string; merchantId: string; status: string; escrowLockedAmount: number } | null>;
  updateTaskGovernanceState(taskId: string, state: "paused" | "published"): Promise<void>;
  createSubmission(input: {
    taskId: string;
    creatorId: string;
    assetUrl: string;
    description: string;
  }): Promise<{ id: string; taskId: string; creatorId: string }>;
  listSubmissionsByTask(taskId: string): Promise<Array<{ id: string; taskId: string }>>;
  listSubmissionsByCreator(creatorId: string): Promise<Array<{ id: string; creatorId: string }>>;
  createReward(input: {
    taskId: string;
    submissionId: string;
    creatorId: string;
    type: "base" | "ranking" | "tip";
    amount: number;
    status: "frozen" | "available" | "cancelled";
  }): Promise<void>;
  listRewardsByCreator(creatorId: string): Promise<Array<{ type: string; status: string; amount: number }>>;
  appendLedgerEntries(entries: Array<{
    taskId: string;
    submissionId?: string;
    account: string;
    amount: number;
    direction: "debit" | "credit";
    note: string;
  }>): Promise<void>;
  createOperatorAction(input: {
    operatorId: string;
    action: "pause-task" | "resume-task" | "ban-user" | "unban-user" | "mark-ledger-anomaly";
    targetType: "task" | "user" | "ledger";
    targetId: string;
    reason: string;
  }): Promise<void>;
  listOperatorActions(): Promise<Array<{ action: string; targetId: string; reason: string }>>;
  updateUserState(userId: string, state: "active" | "banned"): Promise<void>;
  markLedgerAnomaly(entryId: string, reason: string): Promise<void>;
}
```

```ts
// packages/database/src/test-db.ts
import { createRepository } from "./sqlite.js";
import { seedDemo } from "./seed.js";

export async function createTestDb() {
  const repository = createRepository(":memory:");

  return {
    repository,
    async seedDemo() {
      return seedDemo(repository);
    }
  };
}
```

```ts
// apps/api/src/lib/db.ts
import { createRepository } from "@meow/database/sqlite";

export const db = createRepository(process.env.MEOW_DB_PATH || "meow.sqlite");
```

- [ ] **Step 4: Run the database tests and typecheck to verify the repository contract works**

Run:

```bash
pnpm --filter @meow/database test -- session-schema.test.ts task-persistence.test.ts
pnpm --filter @meow/database typecheck
```

Expected: PASS with the two test files green and `Found 0 errors`.

- [ ] **Step 5: Commit**

```bash
git add packages/database apps/api/package.json apps/api/src/lib/db.ts
git commit -m "feat: add sqlite repository foundation"
```

---

### Task 3: Add Real Auth, Session Lookup, and Role Switching to the API

**Files:**
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/services/auth.ts`
- Create: `apps/api/src/tests/auth-session.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/lib/session.ts`
- Modify: `packages/contracts/src/index.ts`

- [ ] **Step 1: Write failing auth tests for login, session restore, and role switch**

```ts
// apps/api/src/tests/auth-session.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("auth session routes", () => {
  it("logs in with a seeded demo account and returns a real session", async () => {
    const response = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "hybrid@example.com",
        secret: "demo-pass",
        client: "web"
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: { displayName: "Demo Hybrid" },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    });
    expect(response.headers.get("set-cookie")).toContain("meow_session=");
  });

  it("restores the current session and switches to merchant role", async () => {
    const login = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "hybrid@example.com",
        secret: "demo-pass",
        client: "web"
      })
    });
    const cookie = login.headers.get("set-cookie") ?? "";

    const current = await app.request("/auth/session", {
      headers: { cookie }
    });
    expect(current.status).toBe(200);
    await expect(current.json()).resolves.toMatchObject({
      activeRole: "creator"
    });

    const switched = await app.request("/auth/switch-role", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ role: "merchant" })
    });

    expect(switched.status).toBe(200);
    await expect(switched.json()).resolves.toMatchObject({
      activeRole: "merchant"
    });
  });
});
```

- [ ] **Step 2: Run the auth test to verify `/auth/*` routes are missing**

Run:

```bash
pnpm --filter @meow/api test -- auth-session.test.ts
```

Expected: FAIL with `404` responses for `/auth/login` and `/auth/session`.

- [ ] **Step 3: Implement auth services, cookie-based session lookup, and role enforcement**

```ts
// apps/api/src/services/auth.ts
import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

export async function loginWithDemoCredentials(input: {
  identifier: string;
  secret: string;
  client: "web" | "miniapp" | "admin";
}) {
  if (input.secret !== "demo-pass") {
    throw new AppError(401, "invalid credentials");
  }

  const user = await db.findUserByIdentifier(input.identifier);
  if (!user) {
    throw new AppError(401, "invalid credentials");
  }

  const session = await db.createSession({
    userId: user.id,
    activeRole: user.roles.includes("creator") ? "creator" : user.roles[0],
    client: input.client
  });

  return { user, session };
}
```

```ts
// apps/api/src/lib/session.ts
import type { Context } from "hono";
import { AppError } from "./errors.js";
import { db } from "./db.js";

export interface AppSession {
  sessionId: string;
  userId: string;
  activeRole: "creator" | "merchant" | "operator";
  roles: Array<"creator" | "merchant" | "operator">;
}

export async function requireSession(c: Context): Promise<AppSession> {
  const cookie = c.req.header("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("meow_session="))
    ?.split("=")[1];

  if (!token) {
    throw new AppError(401, "missing session");
  }

  const session = await db.findSession(token);
  if (!session) {
    throw new AppError(401, "invalid session");
  }

  const user = await db.getUser(session.userId);
  if (!user) {
    throw new AppError(401, "invalid session");
  }

  return {
    sessionId: session.id,
    userId: user.id,
    activeRole: session.activeRole,
    roles: user.roles
  };
}
```

```ts
// apps/api/src/routes/auth.ts
import { Hono } from "hono";
import { loginWithDemoCredentials } from "../services/auth.js";
import { requireSession } from "../lib/session.js";
import { db } from "../lib/db.js";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const { user, session } = await loginWithDemoCredentials(body);
  c.header("Set-Cookie", `meow_session=${session.id}; Path=/; HttpOnly; SameSite=Lax`);
  return c.json({
    user: { id: user.id, displayName: user.displayName },
    roles: user.roles,
    activeRole: session.activeRole
  });
});

authRoutes.get("/session", async (c) => {
  const session = await requireSession(c);
  return c.json(session);
});

authRoutes.post("/switch-role", async (c) => {
  const session = await requireSession(c);
  const body = await c.req.json();
  const next = await db.switchSessionRole(session.sessionId, body.role);
  return c.json(next);
});
```

```ts
// apps/api/src/app.ts
import { authRoutes } from "./routes/auth.js";

app.route("/auth", authRoutes);
```

- [ ] **Step 4: Run auth and existing health tests to verify the new session layer does not break routing**

Run:

```bash
pnpm --filter @meow/api test -- auth-session.test.ts health.test.ts
```

Expected: PASS with the auth tests and health test green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/auth.ts apps/api/src/services/auth.ts apps/api/src/lib/session.ts apps/api/src/app.ts apps/api/src/tests/auth-session.test.ts packages/contracts/src/index.ts
git commit -m "feat: add api auth and session routes"
```

---

### Task 4: Port the Merchant and Creator Workflow Services to the Repository Layer

**Files:**
- Modify: `apps/api/src/routes/creator.ts`
- Modify: `apps/api/src/routes/merchant.ts`
- Modify: `apps/api/src/services/tasks.ts`
- Modify: `apps/api/src/services/submissions.ts`
- Modify: `apps/api/src/services/rewards.ts`
- Modify: `apps/api/src/services/settlement.ts`
- Modify: `apps/api/src/services/wallet.ts`
- Modify: `apps/api/src/tests/merchant-publish.test.ts`
- Modify: `apps/api/src/tests/creator-submission.test.ts`
- Modify: `apps/api/src/tests/read-models.test.ts`
- Modify: `apps/api/src/tests/settlement.test.ts`

- [ ] **Step 1: Rewrite the workflow regression test to authenticate first instead of using `x-demo-user`**

```ts
// apps/api/src/tests/read-models.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

async function login(identifier: string) {
  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier,
      secret: "demo-pass",
      client: "web"
    })
  });

  return response.headers.get("set-cookie") ?? "";
}

describe("api read models for unified surfaces", () => {
  it("runs publish -> submit -> reward -> settle with persisted sessions", async () => {
    const merchantCookie = await login("hybrid@example.com");
    const creatorCookie = await login("creator@example.com");

    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const submissionResponse = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/unified.mp4",
        description: "unified surface"
      })
    });

    expect(submissionResponse.status).toBe(201);
  });
});
```

- [ ] **Step 2: Run the workflow tests to verify old access assumptions fail**

Run:

```bash
pnpm --filter @meow/api test -- merchant-publish.test.ts creator-submission.test.ts settlement.test.ts read-models.test.ts
```

Expected: FAIL because `requireMerchant` and `requireCreator` still read `x-demo-user`, and services still depend on the old in-memory store.

- [ ] **Step 3: Update routes and services to consume `requireSession()` plus the repository-backed `db`**

```ts
// apps/api/src/routes/merchant.ts
import { requireSession } from "../lib/session.js";

merchantRoutes.get("/tasks", async (c) => {
  const session = await requireSession(c);
  if (session.activeRole !== "merchant") {
    throw new AppError(403, "merchant access denied");
  }

  return c.json(await listMerchantTasks(session.userId));
});
```

```ts
// apps/api/src/routes/creator.ts
import { requireSession } from "../lib/session.js";

creatorRoutes.get("/tasks", async (c) => {
  const session = await requireSession(c);
  if (session.activeRole !== "creator") {
    throw new AppError(403, "creator access denied");
  }

  return c.json(await listPublicTasks());
});
```

```ts
// apps/api/src/services/tasks.ts
import { db } from "../lib/db.js";

export async function listMerchantTasks(merchantId: string) {
  return db.listTasksByMerchant(merchantId);
}

export async function publishTask(merchantId: string, taskId: string) {
  const task = await db.getTask(taskId);
  if (!task || task.merchantId !== merchantId) {
    throw new Error("task not found");
  }

  await db.publishTask(taskId, { escrowLockedAmount: 300 });
  await db.appendLedgerEntries([
    {
      taskId,
      account: "merchant_escrow",
      amount: 300,
      direction: "credit",
      note: "任务发布托管"
    }
  ]);

  return db.getTask(taskId);
}
```

```ts
// apps/api/src/services/wallet.ts
import { db } from "../lib/db.js";

export async function getCreatorWalletSnapshot(creatorId: string) {
  const rewards = await db.listRewardsByCreator(creatorId);
  const frozenAmount = rewards
    .filter((reward) => reward.status === "frozen")
    .reduce((sum, reward) => sum + reward.amount, 0);
  const availableAmount = rewards
    .filter((reward) => reward.status === "available")
    .reduce((sum, reward) => sum + reward.amount, 0);

  return {
    creatorId,
    frozenAmount,
    availableAmount,
    submissionCount: (await db.listSubmissionsByCreator(creatorId)).length
  };
}
```

- [ ] **Step 4: Run the workflow regression suite and typecheck**

Run:

```bash
pnpm --filter @meow/api test -- merchant-publish.test.ts creator-submission.test.ts settlement.test.ts read-models.test.ts
pnpm --filter @meow/api typecheck
```

Expected: PASS with the existing main-chain tests green under real sessions.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/creator.ts apps/api/src/routes/merchant.ts apps/api/src/services/tasks.ts apps/api/src/services/submissions.ts apps/api/src/services/rewards.ts apps/api/src/services/settlement.ts apps/api/src/services/wallet.ts apps/api/src/tests/merchant-publish.test.ts apps/api/src/tests/creator-submission.test.ts apps/api/src/tests/read-models.test.ts apps/api/src/tests/settlement.test.ts
git commit -m "feat: move workflow services to repository sessions"
```

---

### Task 5: Add Operator Routes, Governance Actions, and Audit Logs

**Files:**
- Create: `apps/api/src/routes/admin.ts`
- Create: `apps/api/src/services/admin.ts`
- Create: `apps/api/src/tests/admin-actions.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `packages/database/src/repository.ts`
- Modify: `packages/database/src/schema.ts`

- [ ] **Step 1: Write failing admin tests for dashboard reads and governance actions**

```ts
// apps/api/src/tests/admin-actions.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

async function loginOperator() {
  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: "operator@example.com",
      secret: "demo-pass",
      client: "admin"
    })
  });

  return response.headers.get("set-cookie") ?? "";
}

describe("admin governance routes", () => {
  it("returns dashboard data and records task pause / resume audits", async () => {
    const cookie = await loginOperator();

    const dashboard = await app.request("/admin/dashboard", {
      headers: { cookie }
    });
    expect(dashboard.status).toBe(200);

    const paused = await app.request("/admin/tasks/task-1/pause", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ reason: "manual moderation" })
    });
    expect(paused.status).toBe(200);

    const resumed = await app.request("/admin/tasks/task-1/resume", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ reason: "issue cleared" })
    });
    expect(resumed.status).toBe(200);

    const banned = await app.request("/admin/users/user-2/ban", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ reason: "manual moderation" })
    });
    expect(banned.status).toBe(200);

    const anomaly = await app.request("/admin/ledger/ledger-1/mark-anomaly", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ reason: "amount mismatch" })
    });
    expect(anomaly.status).toBe(200);

    const ledger = await app.request("/admin/ledger", {
      headers: { cookie }
    });
    expect(ledger.status).toBe(200);
    await expect(ledger.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "pause-task" }),
        expect.objectContaining({ action: "resume-task" }),
        expect.objectContaining({ action: "ban-user" }),
        expect.objectContaining({ action: "mark-ledger-anomaly" })
      ])
    );
  });
});
```

- [ ] **Step 2: Run the admin test to verify routes and audit queries are missing**

Run:

```bash
pnpm --filter @meow/api test -- admin-actions.test.ts
```

Expected: FAIL with `404` for `/admin/dashboard` and missing repository audit methods.

- [ ] **Step 3: Implement operator-only admin routes and audit-backed actions**

```ts
// apps/api/src/services/admin.ts
import { AppError } from "../lib/errors.js";
import { db } from "../lib/db.js";

export async function pauseTask(input: {
  operatorId: string;
  taskId: string;
  reason: string;
}) {
  const task = await db.getTask(input.taskId);
  if (!task) {
    throw new AppError(404, "task not found");
  }

  await db.updateTaskGovernanceState(input.taskId, "paused");
  await db.createOperatorAction({
    operatorId: input.operatorId,
    action: "pause-task",
    targetType: "task",
    targetId: input.taskId,
    reason: input.reason
  });

  return db.getTask(input.taskId);
}

export async function listDashboard() {
  const actions = await db.listOperatorActions();

  return {
    title: "系统总览",
    summary: "围绕任务审核、资金流转和风险动作的单日总览。",
    metrics: [
      {
        label: "待治理任务",
        value: `${actions.filter((item) => item.action === "pause-task").length}`,
        trend: "基于真实操作记录"
      }
    ],
    alerts: actions.slice(-3).map((item) => ({
      title: item.action,
      detail: `${item.targetId} / ${item.reason}`
    }))
  };
}

export async function listLedgerRows() {
  const actions = await db.listOperatorActions();

  return actions.map((item, index) => ({
    id: `operator-log-${index + 1}`,
    action: item.action,
    targetId: item.targetId,
    reason: item.reason
  }));
}

export async function banUser(input: {
  operatorId: string;
  userId: string;
  reason: string;
}) {
  await db.updateUserState(input.userId, "banned");
  await db.createOperatorAction({
    operatorId: input.operatorId,
    action: "ban-user",
    targetType: "user",
    targetId: input.userId,
    reason: input.reason
  });

  return { userId: input.userId, state: "banned" };
}

export async function markLedgerAnomaly(input: {
  operatorId: string;
  entryId: string;
  reason: string;
}) {
  await db.markLedgerAnomaly(input.entryId, input.reason);
  await db.createOperatorAction({
    operatorId: input.operatorId,
    action: "mark-ledger-anomaly",
    targetType: "ledger",
    targetId: input.entryId,
    reason: input.reason
  });

  return { entryId: input.entryId, status: "flagged" };
}
```

```ts
// apps/api/src/routes/admin.ts
import { Hono } from "hono";
import { requireSession } from "../lib/session.js";
import {
  banUser,
  listDashboard,
  listLedgerRows,
  markLedgerAnomaly,
  pauseTask,
  resumeTask
} from "../services/admin.js";

export const adminRoutes = new Hono();

adminRoutes.use("*", async (c, next) => {
  const session = await requireSession(c);
  if (session.activeRole !== "operator") {
    throw new Error("operator access denied");
  }
  c.set("session", session);
  await next();
});

adminRoutes.get("/dashboard", async (c) => {
  const session = c.get("session");
  return c.json(await listDashboard(session.userId));
});

adminRoutes.post("/tasks/:taskId/pause", async (c) => {
  const session = c.get("session");
  const body = await c.req.json();
  return c.json(
    await pauseTask({
      operatorId: session.userId,
      taskId: c.req.param("taskId"),
      reason: body.reason
    })
  );
});

adminRoutes.post("/tasks/:taskId/resume", async (c) => {
  const session = c.get("session");
  const body = await c.req.json();
  return c.json(
    await resumeTask({
      operatorId: session.userId,
      taskId: c.req.param("taskId"),
      reason: body.reason
    })
  );
});

adminRoutes.get("/ledger", async (c) => c.json(await listLedgerRows()));

adminRoutes.post("/users/:userId/ban", async (c) => {
  const session = c.get("session");
  const body = await c.req.json();
  return c.json(
    await banUser({
      operatorId: session.userId,
      userId: c.req.param("userId"),
      reason: body.reason
    })
  );
});

adminRoutes.post("/ledger/:entryId/mark-anomaly", async (c) => {
  const session = c.get("session");
  const body = await c.req.json();
  return c.json(
    await markLedgerAnomaly({
      operatorId: session.userId,
      entryId: c.req.param("entryId"),
      reason: body.reason
    })
  );
});
```

```ts
// apps/api/src/app.ts
import { adminRoutes } from "./routes/admin.js";

app.route("/admin", adminRoutes);
```

- [ ] **Step 4: Run the admin tests together with the auth suite**

Run:

```bash
pnpm --filter @meow/api test -- admin-actions.test.ts auth-session.test.ts
```

Expected: PASS with dashboard reads and pause/resume audit checks green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/admin.ts apps/api/src/services/admin.ts apps/api/src/tests/admin-actions.test.ts apps/api/src/app.ts packages/database/src/repository.ts packages/database/src/schema.ts
git commit -m "feat: add operator admin actions"
```

---

### Task 6: Build the Real Web Login Flow, Role Switch, and API-Driven Pages

**Files:**
- Create: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/lib/session.ts`
- Create: `apps/web/src/lib/models.ts`
- Create: `apps/web/src/routes/TaskDetailPage.tsx`
- Create: `apps/web/src/routes/SubmissionEditorPage.tsx`
- Create: `apps/web/src/routes/WalletPage.tsx`
- Create: `apps/web/src/components/RoleSwitch.tsx`
- Create: `apps/web/src/components/TaskCard.tsx`
- Create: `apps/web/src/tests/login-page.test.tsx`
- Create: `apps/web/src/tests/role-switch.test.tsx`
- Create: `apps/web/src/tests/task-flow.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/routes/LoginPage.tsx`
- Modify: `apps/web/src/routes/CreatorHomePage.tsx`
- Modify: `apps/web/src/routes/MerchantTasksPage.tsx`

- [ ] **Step 1: Write failing web tests for login submit, role switching, and page data rendering**

```tsx
// apps/web/src/tests/role-switch.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoleSwitch } from "../components/RoleSwitch.js";

describe("role switch", () => {
  it("requests a role switch and updates the active label", async () => {
    const onSwitch = vi.fn();

    render(
      <RoleSwitch
        roles={["creator", "merchant"]}
        activeRole="creator"
        onSwitch={onSwitch}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "切换到商家" }));
    expect(onSwitch).toHaveBeenCalledWith("merchant");
  });
});
```

```tsx
// apps/web/src/tests/login-page.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../routes/LoginPage.js";

describe("login page", () => {
  it("submits demo credentials", () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} loading={false} />);

    fireEvent.change(screen.getByLabelText("账号"), {
      target: { value: "hybrid@example.com" }
    });
    fireEvent.change(screen.getByLabelText("口令"), {
      target: { value: "demo-pass" }
    });
    fireEvent.click(screen.getByRole("button", { name: "进入创意喵" }));

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: "hybrid@example.com",
      secret: "demo-pass",
      client: "web"
    });
  });
});
```

```tsx
// apps/web/src/tests/task-flow.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorHomePage } from "../routes/CreatorHomePage.js";
import { MerchantTasksPage } from "../routes/MerchantTasksPage.js";

describe("creator home page", () => {
  it("renders community-first task cards from api data", () => {
    render(
      <CreatorHomePage
        tasks={[
          {
            id: "task-1",
            title: "春季穿搭口播征稿",
            brandName: "Demo Brand",
            budgetText: "¥300",
            deadlineText: "3 天后截止"
          }
        ]}
      />
    );

    expect(screen.getByText("春季穿搭口播征稿")).toBeInTheDocument();
    expect(screen.getByText("Demo Brand")).toBeInTheDocument();
    expect(screen.getByText("¥300")).toBeInTheDocument();
  });

  it("renders merchant task management cards", () => {
    render(
      <MerchantTasksPage
        tasks={[
          {
            id: "task-1",
            title: "春季穿搭口播征稿",
            submissionCount: 18,
            statusText: "审核中"
          }
        ]}
      />
    );

    expect(screen.getByText("任务管理")).toBeInTheDocument();
    expect(screen.getByText("审核中")).toBeInTheDocument();
    expect(screen.getByText("18 件投稿")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the web tests to verify interactive components are still missing**

Run:

```bash
pnpm --filter @meow/web test -- login-page.test.tsx role-switch.test.tsx task-flow.test.tsx
```

Expected: FAIL because the components and API helpers do not exist yet.

- [ ] **Step 3: Implement the login page, role switcher, and API-driven page models**

```tsx
// apps/web/src/routes/LoginPage.tsx
import { useState } from "react";

interface LoginPageProps {
  loading: boolean;
  onSubmit: (input: { identifier: string; secret: string; client: "web" }) => void;
}

export function LoginPage({ loading, onSubmit }: LoginPageProps) {
  const [identifier, setIdentifier] = useState("hybrid@example.com");
  const [secret, setSecret] = useState("demo-pass");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ identifier, secret, client: "web" });
      }}
    >
      <h1>登录创意喵</h1>
      <label>
        账号
        <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
      </label>
      <label>
        口令
        <input value={secret} onChange={(event) => setSecret(event.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        进入创意喵
      </button>
    </form>
  );
}
```

```tsx
// apps/web/src/components/RoleSwitch.tsx
interface RoleSwitchProps {
  roles: Array<"creator" | "merchant">;
  activeRole: "creator" | "merchant";
  onSwitch: (role: "creator" | "merchant") => void;
}

export function RoleSwitch({ roles, activeRole, onSwitch }: RoleSwitchProps) {
  const nextRole = roles.find((role) => role !== activeRole);

  if (!nextRole) {
    return null;
  }

  return (
    <button type="button" onClick={() => onSwitch(nextRole)}>
      {nextRole === "merchant" ? "切换到商家" : "切换到创作者"}
    </button>
  );
}
```

```ts
// apps/web/src/lib/api.ts
export async function login(input: {
  identifier: string;
  secret: string;
  client: "web";
}) {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error("login failed");
  }

  return response.json();
}

export async function switchRole(role: "creator" | "merchant") {
  const response = await fetch("/auth/switch-role", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role })
  });

  if (!response.ok) {
    throw new Error("switch failed");
  }

  return response.json();
}
```

```tsx
// apps/web/src/routes/CreatorHomePage.tsx
export function CreatorHomePage({
  tasks
}: {
  tasks: Array<{
    id: string;
    title: string;
    brandName: string;
    budgetText: string;
    deadlineText: string;
  }>;
}) {
  return (
    <section>
      <h2>悬赏大厅</h2>
      {tasks.map((task) => (
        <article key={task.id}>
          <h3>{task.title}</h3>
          <p>{task.brandName}</p>
          <p>{task.budgetText}</p>
          <p>{task.deadlineText}</p>
        </article>
      ))}
    </section>
  );
}
```

```tsx
// apps/web/src/routes/MerchantTasksPage.tsx
export function MerchantTasksPage({
  tasks
}: {
  tasks: Array<{
    id: string;
    title: string;
    submissionCount: number;
    statusText: string;
  }>;
}) {
  return (
    <section>
      <h2>任务管理</h2>
      {tasks.map((task) => (
        <article key={task.id}>
          <h3>{task.title}</h3>
          <p>{task.statusText}</p>
          <p>{task.submissionCount} 件投稿</p>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Run the web tests and build**

Run:

```bash
pnpm --filter @meow/web test -- login-page.test.tsx role-switch.test.tsx task-flow.test.tsx app-shell.test.tsx
pnpm --filter @meow/web build
```

Expected: PASS with all four tests green and a successful Vite build.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: add web login and role switched pages"
```

---

### Task 7: Move the Mini Program to Unified Session Bootstrapping

**Files:**
- Modify: `apps/wechat-miniapp/miniprogram/app.js`
- Modify: `apps/wechat-miniapp/miniprogram/app.json`
- Modify: `apps/wechat-miniapp/src/services/http.js`
- Modify: `apps/wechat-miniapp/src/services/store.js`
- Modify: `apps/wechat-miniapp/src/services/tasks.js`
- Modify: `apps/wechat-miniapp/src/services/submissions.js`
- Modify: `apps/wechat-miniapp/src/services/wallet.js`
- Modify: `apps/wechat-miniapp/src/services/role.js`
- Modify: `apps/wechat-miniapp/src/tests/task-feed.test.js`
- Modify: `apps/wechat-miniapp/src/tests/task-detail.test.js`
- Modify: `apps/wechat-miniapp/src/tests/workspace.test.js`

- [ ] **Step 1: Write failing mini program tests for persisted session bootstrap and role switching**

```js
// apps/wechat-miniapp/src/tests/workspace.test.js
import { describe, expect, it } from "vitest";
import { createRoleService } from "../services/role.js";

describe("mini program role service", () => {
  it("loads the current session and switches between creator and merchant", async () => {
    const api = {
      getSession: async () => ({
        user: { id: "user-1" },
        activeRole: "creator",
        roles: ["creator", "merchant"]
      }),
      switchRole: async (role) => ({
        user: { id: "user-1" },
        activeRole: role,
        roles: ["creator", "merchant"]
      })
    };

    const service = createRoleService(api);
    expect(await service.loadSession()).toMatchObject({ activeRole: "creator" });
    expect(await service.switchRole("merchant")).toMatchObject({ activeRole: "merchant" });
  });
});
```

- [ ] **Step 2: Run the mini program tests to verify session-aware services are missing**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- workspace.test.js task-feed.test.js task-detail.test.js
```

Expected: FAIL because `createRoleService` and session bootstrap behavior do not exist.

- [ ] **Step 3: Implement session bootstrap in the mini program service layer**

```js
// apps/wechat-miniapp/src/services/http.js
const BASE_URL = "http://localhost:3001";

export function createHttpClient(storage) {
  return async function request(path, options = {}) {
    const sessionToken = storage.get("sessionToken");
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${BASE_URL}${path}`,
        method: options.method || "GET",
        data: options.data,
        header: {
          "content-type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          ...(options.headers ?? {})
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
            return;
          }

          reject(new Error(`request failed: ${res.statusCode}`));
        },
        fail(error) {
          reject(error);
        }
      });
    });
  };
}
```

```js
// apps/wechat-miniapp/src/services/role.js
export function createRoleService(api) {
  return {
    loadSession() {
      return api.getSession();
    },
    switchRole(role) {
      return api.switchRole(role);
    }
  };
}
```

```js
// apps/wechat-miniapp/miniprogram/app.js
import { createRoleService } from "../src/services/role.js";

App({
  async onLaunch() {
    const roleService = createRoleService({
      getSession: () => Promise.resolve(null),
      switchRole: (role) => Promise.resolve({ activeRole: role })
    });

    this.globalData = {
      session: await roleService.loadSession()
    };
  }
});
```

- [ ] **Step 4: Run the mini program tests and project typecheck**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- workspace.test.js task-feed.test.js task-detail.test.js
pnpm --filter @meow/wechat-miniapp typecheck
```

Expected: PASS with role bootstrap tests green and the JS check script succeeding.

- [ ] **Step 5: Commit**

```bash
git add apps/wechat-miniapp/miniprogram/app.js apps/wechat-miniapp/miniprogram/app.json apps/wechat-miniapp/src/services/http.js apps/wechat-miniapp/src/services/store.js apps/wechat-miniapp/src/services/tasks.js apps/wechat-miniapp/src/services/submissions.js apps/wechat-miniapp/src/services/wallet.js apps/wechat-miniapp/src/services/role.js apps/wechat-miniapp/src/tests/task-feed.test.js apps/wechat-miniapp/src/tests/task-detail.test.js apps/wechat-miniapp/src/tests/workspace.test.js
git commit -m "feat: unify miniapp session bootstrap"
```

---

### Task 8: Replace Admin Preview Data with Real Operator API Calls

**Files:**
- Create: `apps/admin/src/routes/LoginPage.tsx`
- Create: `apps/admin/src/tests/admin-login.test.tsx`
- Modify: `apps/admin/src/lib/api.ts`
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/routes/DashboardPage.tsx`
- Modify: `apps/admin/src/routes/TasksPage.tsx`
- Modify: `apps/admin/src/routes/TaskDetailPage.tsx`
- Modify: `apps/admin/src/routes/UsersPage.tsx`
- Modify: `apps/admin/src/routes/LedgerPage.tsx`
- Modify: `apps/admin/src/tests/dashboard-page.test.tsx`

- [ ] **Step 1: Write the failing admin UI test against fetched dashboard data**

```tsx
// apps/admin/src/tests/admin-login.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../routes/LoginPage.js";

describe("admin login page", () => {
  it("submits operator demo credentials", () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} loading={false} />);

    screen.getByRole("button", { name: "进入后台" }).click();

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: "operator@example.com",
      secret: "demo-pass",
      client: "admin"
    });
  });
});
```

```tsx
// apps/admin/src/tests/dashboard-page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "../routes/DashboardPage.js";

describe("dashboard page", () => {
  it("renders operator metrics from the admin api model", () => {
    render(
      <DashboardPage
        snapshot={{
          title: "系统总览",
          summary: "围绕任务审核、资金流转和风险动作的单日总览。",
          metrics: [
            { label: "待治理任务", value: "12", trend: "较昨日 +1" }
          ],
          alerts: [
            { title: "存在人工暂停任务", detail: "task-1 需要复核" }
          ]
        }}
      />
    );

    expect(screen.getByText("系统总览")).toBeInTheDocument();
    expect(screen.getByText("待治理任务")).toBeInTheDocument();
    expect(screen.getByText("存在人工暂停任务")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the admin test to verify the UI still depends on preview globals**

Run:

```bash
pnpm --filter @meow/admin test -- admin-login.test.tsx dashboard-page.test.tsx
```

Expected: FAIL because the operator login page and async session bootstrap do not exist yet, and `lib/api.ts` still exports preview constants instead of async API functions.

- [ ] **Step 3: Convert admin data access to async API functions and wire action buttons**

```ts
// apps/admin/src/lib/api.ts
export async function loginOperator() {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: "operator@example.com",
      secret: "demo-pass",
      client: "admin"
    })
  });

  if (!response.ok) {
    throw new Error("operator login failed");
  }

  return response.json();
}

export async function fetchAdminSession() {
  const response = await fetch("/auth/session");
  return response.ok ? response.json() : null;
}

export async function fetchDashboardSnapshot() {
  const response = await fetch("/admin/dashboard");
  if (!response.ok) {
    throw new Error("dashboard request failed");
  }

  return response.json();
}

export async function pauseTask(taskId: string, reason: string) {
  const response = await fetch(`/admin/tasks/${taskId}/pause`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    throw new Error("pause request failed");
  }

  return response.json();
}
```

```tsx
// apps/admin/src/App.tsx
import { useEffect, useState } from "react";
import { fetchAdminSession, fetchDashboardSnapshot, loginOperator } from "./lib/api.js";
import { DashboardPage } from "./routes/DashboardPage.js";
import { LoginPage } from "./routes/LoginPage.js";

export function App() {
  const [session, setSession] = useState<null | { activeRole: "operator" }>(null);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    void fetchAdminSession().then((nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        void fetchDashboardSnapshot().then(setDashboard);
      }
    });
  }, []);

  if (!session) {
    return (
      <LoginPage
        loading={false}
        onSubmit={async () => {
          await loginOperator();
          const nextSession = await fetchAdminSession();
          setSession(nextSession);
          setDashboard(await fetchDashboardSnapshot());
        }}
      />
    );
  }

  return dashboard ? <DashboardPage snapshot={dashboard} /> : <p>加载中...</p>;
}
```

```tsx
// apps/admin/src/routes/LoginPage.tsx
export function LoginPage({
  loading,
  onSubmit
}: {
  loading: boolean;
  onSubmit: (input: { identifier: string; secret: string; client: "admin" }) => void;
}) {
  return (
    <main>
      <h1>登录创意喵后台</h1>
      <button
        type="button"
        disabled={loading}
        onClick={() =>
          onSubmit({
            identifier: "operator@example.com",
            secret: "demo-pass",
            client: "admin"
          })
        }
      >
        进入后台
      </button>
    </main>
  );
}
```

```tsx
// apps/admin/src/routes/TasksPage.tsx
export function TasksPage({
  tasks,
  onPause
}: {
  tasks: Array<{ id: string; title: string; status: string }>;
  onPause: (taskId: string) => void;
}) {
  return (
    <section>
      {tasks.map((task) => (
        <article key={task.id}>
          <h3>{task.title}</h3>
          <p>{task.status}</p>
          <button type="button" onClick={() => onPause(task.id)}>
            下架任务
          </button>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Run admin tests and build**

Run:

```bash
pnpm --filter @meow/admin test -- admin-login.test.tsx dashboard-page.test.tsx admin-layout.test.tsx
pnpm --filter @meow/admin build
```

Expected: PASS with the operator dashboard tests green and a successful build.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/lib/api.ts apps/admin/src/App.tsx apps/admin/src/routes/LoginPage.tsx apps/admin/src/routes/DashboardPage.tsx apps/admin/src/routes/TasksPage.tsx apps/admin/src/routes/TaskDetailPage.tsx apps/admin/src/routes/UsersPage.tsx apps/admin/src/routes/LedgerPage.tsx apps/admin/src/tests/admin-login.test.tsx apps/admin/src/tests/dashboard-page.test.tsx
git commit -m "feat: wire admin to operator api"
```

---

### Task 9: Final Contract Cleanup, Root Verification, and Docs Refresh

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `turbo.json`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/src/tests/health.test.ts`

- [ ] **Step 1: Write the final contract regression test that proves all surfaces are registered in the workspace**

```ts
// packages/contracts/src/index.ts
export const surfaceIds = ["web", "wechat-miniapp", "admin", "api"] as const;
```

```ts
// apps/api/src/tests/health.test.ts
import { describe, expect, it } from "vitest";
import { surfaceIds } from "@meow/contracts";
import { app } from "../app.js";

describe("api health", () => {
  it("responds with ok and the registered surface list", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "meow-api",
      surfaces: surfaceIds
    });
  });
});
```

- [ ] **Step 2: Run the final verification tests to confirm the remaining contract and docs updates are still missing**

Run:

```bash
pnpm --filter @meow/api test -- health.test.ts
```

Expected: FAIL because `/health` does not yet return `surfaces`, and docs/scripts still describe only the older surfaces.

- [ ] **Step 3: Update health output, README, and root verification commands**

```ts
// apps/api/src/app.ts
import { surfaceIds } from "@meow/contracts";

app.get("/health", (c) =>
  c.json({ ok: true, service: "meow-api", surfaces: surfaceIds })
);
```

```md
// README.md
## Local Start

    pnpm --filter @meow/api dev
    pnpm --filter @meow/web dev
    pnpm --filter @meow/admin dev
    pnpm --filter @meow/wechat-miniapp dev

`apps/web` 与 `apps/wechat-miniapp` 都接入同一套 `/auth/*`, `/creator/*`, `/merchant/*` 接口；
`apps/admin` 使用 `/admin/*` 接口，登录账号必须具有 `operator` 角色。
```

```json
// package.json
{
  "scripts": {
    "smoke": "pnpm --filter @meow/database test -- session-schema.test.ts task-persistence.test.ts && pnpm --filter @meow/api test && pnpm --filter @meow/web build && pnpm --filter @meow/admin build && pnpm --filter @meow/wechat-miniapp typecheck && pnpm harness"
  }
}
```

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
pnpm --filter @meow/database test -- session-schema.test.ts task-persistence.test.ts
pnpm --filter @meow/api test
pnpm --filter @meow/web build
pnpm --filter @meow/admin build
pnpm --filter @meow/wechat-miniapp typecheck
pnpm smoke
```

Expected: PASS across database, api, web, admin, mini program, and smoke verification.

- [ ] **Step 5: Commit**

```bash
git add README.md package.json turbo.json packages/contracts/src/index.ts apps/api/src/app.ts apps/api/src/tests/health.test.ts
git commit -m "chore: finalize unified surface verification"
```
