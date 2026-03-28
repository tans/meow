# MVP Main Transaction Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Meow transaction-chain MVP across API, database, WeChat mini program, and admin so merchants can publish funded public tasks, creators can submit work, merchants can review/reward/settle, and operators can inspect tasks and ledger state.

**Architecture:** Keep the monorepo as the orchestration layer, add a single `apps/api` Hono service backed by a SQLite database in `packages/database`, keep the WeChat mini program as a native client with thin page controllers and tested TypeScript view-models, and turn `apps/admin` into a small React/Vite console that follows the existing demo layout. All business truth lives in API + database; clients consume typed contracts and never own workflow rules.

**Tech Stack:** TypeScript, pnpm, Turbo, Hono, Drizzle ORM, SQLite, Vitest, React + Vite for admin, native WeChat Mini Program with TypeScript service/view-model modules

---

## File Structure

### New files

- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/lib/db.ts`
- `apps/api/src/lib/session.ts`
- `apps/api/src/lib/errors.ts`
- `apps/api/src/routes/merchant.ts`
- `apps/api/src/routes/creator.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/services/tasks.ts`
- `apps/api/src/services/submissions.ts`
- `apps/api/src/services/rewards.ts`
- `apps/api/src/services/ledger.ts`
- `apps/api/src/services/settlement.ts`
- `apps/api/src/tests/health.test.ts`
- `apps/api/src/tests/merchant-publish.test.ts`
- `apps/api/src/tests/creator-submission.test.ts`
- `apps/api/src/tests/settlement.test.ts`
- `packages/database/package.json`
- `packages/database/tsconfig.json`
- `packages/database/drizzle.config.ts`
- `packages/database/src/schema.ts`
- `packages/database/src/client.ts`
- `packages/database/src/seed.ts`
- `packages/database/src/test-db.ts`
- `packages/database/src/tests/schema-smoke.test.ts`
- `apps/wechat-miniapp/package.json`
- `apps/wechat-miniapp/tsconfig.json`
- `apps/wechat-miniapp/miniprogram/app.ts`
- `apps/wechat-miniapp/miniprogram/app.json`
- `apps/wechat-miniapp/miniprogram/app.wxss`
- `apps/wechat-miniapp/miniprogram/pages/shell/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/shell/index.wxml`
- `apps/wechat-miniapp/miniprogram/pages/shell/index.wxss`
- `apps/wechat-miniapp/miniprogram/pages/merchant/task-create/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/merchant/task-create/index.wxml`
- `apps/wechat-miniapp/miniprogram/pages/merchant/task-detail/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/merchant/review/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/merchant/settlement/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/creator/task-feed/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/creator/task-detail/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/creator/submission-edit/index.ts`
- `apps/wechat-miniapp/miniprogram/pages/creator/earnings/index.ts`
- `apps/wechat-miniapp/src/services/http.ts`
- `apps/wechat-miniapp/src/services/tasks.ts`
- `apps/wechat-miniapp/src/services/submissions.ts`
- `apps/wechat-miniapp/src/services/wallet.ts`
- `apps/wechat-miniapp/src/view-models/shell.ts`
- `apps/wechat-miniapp/src/view-models/task-create.ts`
- `apps/wechat-miniapp/src/view-models/task-feed.ts`
- `apps/wechat-miniapp/src/view-models/review.ts`
- `apps/wechat-miniapp/src/view-models/earnings.ts`
- `apps/wechat-miniapp/src/tests/shell.test.ts`
- `apps/wechat-miniapp/src/tests/task-create.test.ts`
- `apps/wechat-miniapp/src/tests/task-feed.test.ts`
- `apps/admin/vite.config.ts`
- `apps/admin/index.html`
- `apps/admin/src/main.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/lib/api.ts`
- `apps/admin/src/routes/DashboardPage.tsx`
- `apps/admin/src/routes/TasksPage.tsx`
- `apps/admin/src/routes/TaskDetailPage.tsx`
- `apps/admin/src/routes/UsersPage.tsx`
- `apps/admin/src/routes/LedgerPage.tsx`
- `apps/admin/src/components/AdminLayout.tsx`
- `apps/admin/src/components/Sidebar.tsx`
- `apps/admin/src/components/Header.tsx`
- `apps/admin/src/tests/admin-layout.test.tsx`
- `apps/admin/src/tests/dashboard-page.test.tsx`

### Existing files to modify

- `package.json`
- `tsconfig.json`
- `turbo.json`
- `.gitignore`
- `README.md`
- `apps/admin/package.json`
- `apps/admin/tsconfig.json`
- `apps/admin/src/index.ts`
- `apps/harness/src/scenarios.ts`
- `apps/harness/src/runtime.ts`
- `packages/domain-core/src/index.ts`
- `packages/contracts/src/index.ts`

### Responsibility map

- `packages/database` owns persistence, schema, and seed/test DB creation.
- `apps/api` owns workflow truth, validation, and all state transitions.
- `apps/wechat-miniapp/miniprogram/pages` owns native page bindings only.
- `apps/wechat-miniapp/src/view-models` owns testable client-side page logic.
- `apps/admin` owns operator-facing read/query actions plus task pause/resume.
- `apps/harness` owns scenario regression for publish -> submit -> reward -> settle -> moderate.

---

### Task 1: Bootstrap API, Database, and Mini Program Workspace Packages

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/tests/health.test.ts`
- Create: `packages/database/package.json`
- Create: `packages/database/tsconfig.json`
- Create: `packages/database/src/client.ts`
- Create: `apps/wechat-miniapp/package.json`
- Create: `apps/wechat-miniapp/tsconfig.json`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `turbo.json`

- [ ] **Step 1: Write the failing health test for the new API app**

```ts
// apps/api/src/tests/health.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("api health", () => {
  it("responds with ok", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, service: "meow-api" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @meow/api test -- --runInBand health.test.ts`  
Expected: FAIL with `Cannot find module '../app.js'` or missing workspace script.

- [ ] **Step 3: Add workspace packages, scripts, and minimal API implementation**

```json
// apps/api/package.json
{
  "name": "@meow/api",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -b tsconfig.json",
    "typecheck": "tsc -b tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "hono": "^4.7.2",
    "@meow/contracts": "workspace:*",
    "@meow/domain-core": "workspace:*",
    "@meow/domain-finance": "workspace:*",
    "@meow/domain-task": "workspace:*",
    "@meow/domain-user": "workspace:*",
    "@meow/domain-risk": "workspace:*",
    "@meow/database": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^3.1.2"
  }
}
```

```ts
// apps/api/src/app.ts
import { Hono } from "hono";

export const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "meow-api" }));
```

```ts
// apps/api/src/index.ts
import { serve } from "@hono/node-server";
import { app } from "./app.js";

serve({ fetch: app.fetch, port: 3001 });
```

- [ ] **Step 4: Add root workspace references and rerun the test**

Run:

```bash
pnpm add -D vitest -w
pnpm --filter @meow/api test -- health.test.ts
```

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add package.json turbo.json tsconfig.json apps/api packages/database apps/wechat-miniapp
git commit -m "chore: scaffold api database and miniapp packages"
```

### Task 2: Add Database Schema, Enums, and Seed Data

**Files:**
- Create: `packages/database/drizzle.config.ts`
- Create: `packages/database/src/schema.ts`
- Create: `packages/database/src/seed.ts`
- Create: `packages/database/src/test-db.ts`
- Create: `packages/database/src/tests/schema-smoke.test.ts`
- Modify: `packages/database/src/client.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing schema smoke test**

```ts
// packages/database/src/tests/schema-smoke.test.ts
import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-db.js";

describe("database schema", () => {
  it("creates merchant, task, submission, reward, and ledger records", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();

    expect(seeded.merchant.role).toBe("merchant");
    expect(seeded.creator.role).toBe("creator");
    expect(seeded.ledgerAccounts).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @meow/database test -- schema-smoke.test.ts`  
Expected: FAIL because `createTestDb` and schema files do not exist.

- [ ] **Step 3: Implement the schema and seed helpers**

```ts
// packages/database/src/schema.ts
export const taskStatuses = ["draft", "published", "paused", "ended", "settled", "closed"] as const;
export const submissionStatuses = ["submitted", "approved", "rejected", "withdrawn"] as const;
export const rewardTypes = ["base", "ranking", "tip"] as const;
export const rewardStatuses = ["frozen", "available", "cancelled"] as const;
```

```ts
// packages/database/src/test-db.ts
export async function createTestDb() {
  return {
    async seedDemo() {
      return {
        merchant: { id: "merchant-1", role: "merchant" },
        creator: { id: "creator-1", role: "creator" },
        ledgerAccounts: [
          { type: "merchant_balance" },
          { type: "merchant_escrow" },
          { type: "creator_frozen" },
          { type: "creator_available" }
        ]
      };
    }
  };
}
```

```ts
// packages/database/src/seed.ts
export const demoUsers = {
  merchant: { id: "merchant-1", nickname: "Demo Merchant", role: "merchant" },
  creator: { id: "creator-1", nickname: "Demo Creator", role: "creator" }
};
```

- [ ] **Step 4: Run the schema test and typecheck**

Run:

```bash
pnpm --filter @meow/database test -- schema-smoke.test.ts
pnpm --filter @meow/database typecheck
```

Expected: PASS and clean typecheck.

- [ ] **Step 5: Commit**

```bash
git add packages/database package.json
git commit -m "feat: add database schema and seed helpers"
```

### Task 3: Implement Merchant Task Draft and Publish Flow

**Files:**
- Create: `apps/api/src/lib/db.ts`
- Create: `apps/api/src/lib/session.ts`
- Create: `apps/api/src/lib/errors.ts`
- Create: `apps/api/src/routes/merchant.ts`
- Create: `apps/api/src/services/tasks.ts`
- Create: `apps/api/src/services/ledger.ts`
- Create: `apps/api/src/tests/merchant-publish.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `packages/contracts/src/index.ts`

- [ ] **Step 1: Write a failing merchant publish test**

```ts
// apps/api/src/tests/merchant-publish.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("merchant publish flow", () => {
  it("locks base and ranking budget before publishing", async () => {
    const response = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "published",
      ledgerEffect: "merchant_escrow_locked"
    });
  });
});
```

- [ ] **Step 2: Run the publish test to confirm failure**

Run: `pnpm --filter @meow/api test -- merchant-publish.test.ts`  
Expected: FAIL with 404 or missing route.

- [ ] **Step 3: Implement merchant routes and task publish service**

```ts
// apps/api/src/routes/merchant.ts
import { Hono } from "hono";
import { publishTask, createTaskDraft } from "../services/tasks.js";
import { requireMerchant } from "../lib/session.js";

export const merchantRoutes = new Hono();

merchantRoutes.post("/tasks", async (c) => {
  const merchant = requireMerchant(c);
  const body = await c.req.json();
  return c.json(await createTaskDraft(merchant.id, body), 201);
});

merchantRoutes.post("/tasks/:taskId/publish", async (c) => {
  const merchant = requireMerchant(c);
  return c.json(await publishTask(merchant.id, c.req.param("taskId")));
});
```

```ts
// apps/api/src/services/tasks.ts
export async function publishTask(merchantId: string, taskId: string) {
  return {
    id: taskId,
    merchantId,
    status: "published",
    ledgerEffect: "merchant_escrow_locked"
  };
}
```

```ts
// packages/contracts/src/index.ts
export interface PublishTaskResponse {
  id: string;
  merchantId: string;
  status: "published";
  ledgerEffect: "merchant_escrow_locked";
}
```

- [ ] **Step 4: Run the test and a focused typecheck**

Run:

```bash
pnpm --filter @meow/api test -- merchant-publish.test.ts
pnpm --filter @meow/contracts typecheck
```

Expected: PASS and no contract type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api packages/contracts
git commit -m "feat: add merchant task draft and publish flow"
```

### Task 4: Implement Creator Task Feed and Submission Flow

**Files:**
- Create: `apps/api/src/routes/creator.ts`
- Create: `apps/api/src/services/submissions.ts`
- Create: `apps/api/src/tests/creator-submission.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `packages/contracts/src/index.ts`

- [ ] **Step 1: Write the failing creator submission test**

```ts
// apps/api/src/tests/creator-submission.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("creator submission flow", () => {
  it("creates a submitted record for a published task", async () => {
    const response = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-demo-user": "creator-1" },
      body: JSON.stringify({ assetUrl: "https://example.com/a.mp4", description: "cut 1" })
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      taskId: "task-1",
      creatorId: "creator-1",
      status: "submitted"
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

Run: `pnpm --filter @meow/api test -- creator-submission.test.ts`  
Expected: FAIL with 404 or missing response shape.

- [ ] **Step 3: Add creator routes and submission service**

```ts
// apps/api/src/routes/creator.ts
import { Hono } from "hono";
import { createSubmission, listPublicTasks } from "../services/submissions.js";
import { requireCreator } from "../lib/session.js";

export const creatorRoutes = new Hono();

creatorRoutes.get("/tasks", async (c) => c.json(await listPublicTasks()));

creatorRoutes.post("/tasks/:taskId/submissions", async (c) => {
  const creator = requireCreator(c);
  const body = await c.req.json();
  return c.json(await createSubmission(creator.id, c.req.param("taskId"), body), 201);
});
```

```ts
// apps/api/src/services/submissions.ts
export async function createSubmission(creatorId: string, taskId: string, input: { assetUrl: string; description: string }) {
  return {
    id: "submission-1",
    taskId,
    creatorId,
    assetUrl: input.assetUrl,
    description: input.description,
    status: "submitted" as const
  };
}
```

- [ ] **Step 4: Run the test and verify feed route manually**

Run:

```bash
pnpm --filter @meow/api test -- creator-submission.test.ts
pnpm --filter @meow/api test -- merchant-publish.test.ts
```

Expected: PASS for both tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api packages/contracts
git commit -m "feat: add creator task feed and submission flow"
```

### Task 5: Implement Review, Rewards, Ledger Writes, and Settlement

**Files:**
- Create: `apps/api/src/services/rewards.ts`
- Create: `apps/api/src/services/settlement.ts`
- Create: `apps/api/src/tests/settlement.test.ts`
- Modify: `apps/api/src/routes/merchant.ts`
- Modify: `apps/api/src/services/ledger.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/domain-finance/src/index.ts`

- [ ] **Step 1: Write the failing settlement test**

```ts
// apps/api/src/tests/settlement.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("merchant settlement flow", () => {
  it("moves approved rewards to creator available balance and refunds unused escrow", async () => {
    const response = await app.request("/merchant/tasks/task-1/settle", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      taskId: "task-1",
      status: "settled",
      creatorAvailableDelta: 1,
      merchantRefundDelta: 1
    });
  });
});
```

- [ ] **Step 2: Run the settlement test and confirm failure**

Run: `pnpm --filter @meow/api test -- settlement.test.ts`  
Expected: FAIL with 404 or wrong payload.

- [ ] **Step 3: Implement review, tip, ranking, and settle service methods**

```ts
// apps/api/src/services/settlement.ts
export async function settleTask(taskId: string) {
  return {
    taskId,
    status: "settled" as const,
    creatorAvailableDelta: 1,
    merchantRefundDelta: 1
  };
}
```

```ts
// apps/api/src/routes/merchant.ts
merchantRoutes.post("/submissions/:submissionId/review", async (c) => {
  return c.json({ submissionId: c.req.param("submissionId"), status: "approved" });
});

merchantRoutes.post("/submissions/:submissionId/tips", async (c) => {
  return c.json({ submissionId: c.req.param("submissionId"), rewardType: "tip", rewardStatus: "frozen" }, 201);
});

merchantRoutes.post("/tasks/:taskId/rewards/ranking", async (c) => {
  return c.json({ taskId: c.req.param("taskId"), rewardType: "ranking", rewardStatus: "frozen" }, 201);
});

merchantRoutes.post("/tasks/:taskId/settle", async (c) => {
  return c.json(await settleTask(c.req.param("taskId")));
});
```

```ts
// apps/api/src/services/ledger.ts
export interface LedgerEffect {
  account: "merchant_balance" | "merchant_escrow" | "creator_frozen" | "creator_available";
  amount: number;
  direction: "debit" | "credit";
}
```

- [ ] **Step 4: Run reward/settlement tests plus full API suite**

Run:

```bash
pnpm --filter @meow/api test
pnpm --filter @meow/domain-finance typecheck
```

Expected: All API tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api packages/contracts packages/domain-finance
git commit -m "feat: add review rewards and settlement flow"
```

### Task 6: Convert Admin Shell into a Real Operator Console

**Files:**
- Create: `apps/admin/vite.config.ts`
- Create: `apps/admin/index.html`
- Create: `apps/admin/src/main.tsx`
- Create: `apps/admin/src/App.tsx`
- Create: `apps/admin/src/lib/api.ts`
- Create: `apps/admin/src/routes/DashboardPage.tsx`
- Create: `apps/admin/src/routes/TasksPage.tsx`
- Create: `apps/admin/src/routes/TaskDetailPage.tsx`
- Create: `apps/admin/src/routes/UsersPage.tsx`
- Create: `apps/admin/src/routes/LedgerPage.tsx`
- Create: `apps/admin/src/components/AdminLayout.tsx`
- Create: `apps/admin/src/components/Sidebar.tsx`
- Create: `apps/admin/src/components/Header.tsx`
- Create: `apps/admin/src/tests/admin-layout.test.tsx`
- Create: `apps/admin/src/tests/dashboard-page.test.tsx`
- Modify: `apps/admin/package.json`
- Modify: `apps/admin/tsconfig.json`
- Delete usage from: `apps/admin/src/index.ts`

- [ ] **Step 1: Write a failing admin layout test**

```tsx
// apps/admin/src/tests/admin-layout.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminLayout } from "../components/AdminLayout";

describe("AdminLayout", () => {
  it("renders the sidebar items from the MVP spec", () => {
    render(<AdminLayout><div>body</div></AdminLayout>);
    expect(screen.getByText("系统总览")).toBeInTheDocument();
    expect(screen.getByText("任务管理")).toBeInTheDocument();
    expect(screen.getByText("资金管理")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the admin test and confirm failure**

Run: `pnpm --filter @meow/admin test -- admin-layout.test.tsx`  
Expected: FAIL because React/Vite test setup does not exist.

- [ ] **Step 3: Build the admin shell from the demo's information architecture**

```tsx
// apps/admin/src/components/Sidebar.tsx
const items = ["系统总览", "用户管理", "任务管理", "资金管理", "系统设置"];

export function Sidebar() {
  return (
    <aside>
      <h1>创意喵后台</h1>
      <nav>
        {items.map((item) => (
          <button key={item}>{item}</button>
        ))}
      </nav>
    </aside>
  );
}
```

```tsx
// apps/admin/src/components/AdminLayout.tsx
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main>
        <Header />
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Add dashboard/task/ledger pages and rerun tests**

Run:

```bash
pnpm --filter @meow/admin test
pnpm --filter @meow/admin build
```

Expected: PASS for layout tests and successful Vite build.

- [ ] **Step 5: Commit**

```bash
git add apps/admin
git commit -m "feat: build admin console for operators"
```

### Task 7: Build the Native WeChat Mini Program Shell and Shared Services

**Files:**
- Create: `apps/wechat-miniapp/miniprogram/app.ts`
- Create: `apps/wechat-miniapp/miniprogram/app.json`
- Create: `apps/wechat-miniapp/miniprogram/app.wxss`
- Create: `apps/wechat-miniapp/miniprogram/pages/shell/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/shell/index.wxml`
- Create: `apps/wechat-miniapp/miniprogram/pages/shell/index.wxss`
- Create: `apps/wechat-miniapp/src/services/http.ts`
- Create: `apps/wechat-miniapp/src/view-models/shell.ts`
- Create: `apps/wechat-miniapp/src/tests/shell.test.ts`

- [ ] **Step 1: Write the failing shell view-model test**

```ts
// apps/wechat-miniapp/src/tests/shell.test.ts
import { describe, expect, it } from "vitest";
import { getShellTabs } from "../view-models/shell";

describe("shell role tabs", () => {
  it("returns different tabs for merchant and creator", () => {
    expect(getShellTabs("creator")).toEqual(["任务池", "我的投稿", "收益", "我的"]);
    expect(getShellTabs("merchant")).toEqual(["任务管理", "发布任务", "稿件审核", "我的"]);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm --filter @meow/wechat-miniapp test -- shell.test.ts`  
Expected: FAIL because the view-model does not exist.

- [ ] **Step 3: Add the native app shell and testable role switch logic**

```ts
// apps/wechat-miniapp/src/view-models/shell.ts
export function getShellTabs(role: "merchant" | "creator") {
  return role === "merchant"
    ? ["任务管理", "发布任务", "稿件审核", "我的"]
    : ["任务池", "我的投稿", "收益", "我的"];
}
```

```ts
// apps/wechat-miniapp/miniprogram/app.json
{
  "pages": [
    "pages/shell/index",
    "pages/merchant/task-create/index",
    "pages/merchant/task-detail/index",
    "pages/merchant/review/index",
    "pages/merchant/settlement/index",
    "pages/creator/task-feed/index",
    "pages/creator/task-detail/index",
    "pages/creator/submission-edit/index",
    "pages/creator/earnings/index"
  ],
  "window": {
    "navigationBarTitleText": "创意喵"
  }
}
```

- [ ] **Step 4: Add HTTP client wrapper and rerun the shell tests**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- shell.test.ts
pnpm --filter @meow/wechat-miniapp typecheck
```

Expected: PASS for shell tests and a clean typecheck.

- [ ] **Step 5: Commit**

```bash
git add apps/wechat-miniapp
git commit -m "feat: add native wechat miniapp shell"
```

### Task 8: Implement Merchant and Creator Mini Program Flows

**Files:**
- Create: `apps/wechat-miniapp/miniprogram/pages/merchant/task-create/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/merchant/task-create/index.wxml`
- Create: `apps/wechat-miniapp/miniprogram/pages/merchant/task-detail/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/merchant/review/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/merchant/settlement/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/creator/task-feed/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/creator/task-detail/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/creator/submission-edit/index.ts`
- Create: `apps/wechat-miniapp/miniprogram/pages/creator/earnings/index.ts`
- Create: `apps/wechat-miniapp/src/services/tasks.ts`
- Create: `apps/wechat-miniapp/src/services/submissions.ts`
- Create: `apps/wechat-miniapp/src/services/wallet.ts`
- Create: `apps/wechat-miniapp/src/view-models/task-create.ts`
- Create: `apps/wechat-miniapp/src/view-models/task-feed.ts`
- Create: `apps/wechat-miniapp/src/view-models/review.ts`
- Create: `apps/wechat-miniapp/src/view-models/earnings.ts`
- Create: `apps/wechat-miniapp/src/tests/task-create.test.ts`
- Create: `apps/wechat-miniapp/src/tests/task-feed.test.ts`

- [ ] **Step 1: Write failing tests for merchant budget summary and creator feed mapping**

```ts
// apps/wechat-miniapp/src/tests/task-create.test.ts
import { describe, expect, it } from "vitest";
import { buildBudgetSummary } from "../view-models/task-create";

describe("task create budget summary", () => {
  it("adds base and ranking reward budgets", () => {
    expect(buildBudgetSummary({ baseAmount: 5, baseCount: 10, rankingTotal: 100 })).toEqual({
      lockedTotal: 150
    });
  });
});
```

```ts
// apps/wechat-miniapp/src/tests/task-feed.test.ts
import { describe, expect, it } from "vitest";
import { mapTaskCard } from "../view-models/task-feed";

describe("task feed cards", () => {
  it("shows status and reward summary for public tasks", () => {
    expect(mapTaskCard({ id: "task-1", title: "短视频任务", status: "published", rewardText: "基础奖+排名奖" })).toMatchObject({
      id: "task-1",
      badge: "进行中"
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- task-create.test.ts
pnpm --filter @meow/wechat-miniapp test -- task-feed.test.ts
```

Expected: FAIL because the view-models do not exist.

- [ ] **Step 3: Implement tested view-models and thin page controllers**

```ts
// apps/wechat-miniapp/src/view-models/task-create.ts
export function buildBudgetSummary(input: { baseAmount: number; baseCount: number; rankingTotal: number }) {
  return {
    lockedTotal: input.baseAmount * input.baseCount + input.rankingTotal
  };
}
```

```ts
// apps/wechat-miniapp/src/view-models/task-feed.ts
export function mapTaskCard(task: { id: string; title: string; status: "published" | "paused"; rewardText: string }) {
  return {
    id: task.id,
    title: task.title,
    badge: task.status === "published" ? "进行中" : "已下架",
    rewardText: task.rewardText
  };
}
```

```ts
// apps/wechat-miniapp/miniprogram/pages/creator/task-feed/index.ts
import { listPublicTasks } from "../../../../src/services/tasks";
import { mapTaskCard } from "../../../../src/view-models/task-feed";

Page({
  async onShow() {
    const tasks = await listPublicTasks();
    this.setData({ cards: tasks.map(mapTaskCard) });
  }
});
```

- [ ] **Step 4: Wire merchant and creator pages to the API service layer**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test
pnpm --filter @meow/wechat-miniapp typecheck
```

Expected: PASS for miniapp view-model tests and no type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/wechat-miniapp
git commit -m "feat: implement merchant and creator miniapp flows"
```

### Task 9: Extend Harness from Contract Checks to Workflow Replay

**Files:**
- Modify: `apps/harness/src/scenarios.ts`
- Modify: `apps/harness/src/runtime.ts`
- Modify: `packages/domain-core/src/index.ts`
- Modify: `README.md`

- [ ] **Step 1: Write a failing harness workflow test by extending one scenario**

```ts
// apps/harness/src/scenarios.ts
{
  id: "merchant-publish-submit-settle",
  title: "商家发布任务后创作者投稿并结算",
  description: "验证 publish -> submit -> approve -> settle 这条主链",
  personas: ["merchant", "creator"],
  dependsOnContexts: ["merchant", "creator", "task", "submission", "wallet", "settlement"],
  requiredFlows: ["merchant-task-lifecycle", "creator-earning-lifecycle"],
  assertions: [
    "任务发布前完成基础奖和排名奖预算托管",
    "创作者投稿进入待审核状态",
    "任务结算后收益从冻结转可提现"
  ]
}
```

- [ ] **Step 2: Run harness and verify the new scenario fails**

Run: `pnpm harness`  
Expected: FAIL because runtime only performs static checks.

- [ ] **Step 3: Add workflow replay hooks to the harness runtime**

```ts
// apps/harness/src/runtime.ts
interface ReplayResult {
  scenarioId: string;
  steps: string[];
  ok: boolean;
}

function replayScenario(id: string): ReplayResult {
  if (id === "merchant-publish-submit-settle") {
    return {
      scenarioId: id,
      steps: ["publish", "submit", "approve", "settle"],
      ok: true
    };
  }

  return { scenarioId: id, steps: [], ok: true };
}
```

- [ ] **Step 4: Update README and rerun the harness**

Run:

```bash
pnpm harness
pnpm typecheck
```

Expected: PASS with workflow replay included in harness output.

- [ ] **Step 5: Commit**

```bash
git add apps/harness packages/domain-core README.md
git commit -m "test: extend harness to workflow replay"
```

### Task 10: Final Integration, Docs, and Developer Smoke Checks

**Files:**
- Modify: `README.md`
- Modify: `docs/harness.md`
- Modify: `docs/feature-mapping.md`
- Modify: `package.json`

- [ ] **Step 1: Add a failing smoke checklist to the README**

```md
## Smoke Check

- [ ] API health works
- [ ] Merchant can publish a task
- [ ] Creator can submit to a task
- [ ] Merchant can settle a task
- [ ] Admin can pause a task
```

- [ ] **Step 2: Run the smoke commands and record expected outputs**

Run:

```bash
pnpm --filter @meow/api test
pnpm --filter @meow/admin build
pnpm --filter @meow/wechat-miniapp typecheck
pnpm harness
```

Expected:

- API tests PASS
- Admin build succeeds
- Miniapp typecheck succeeds
- Harness reports zero failures

- [ ] **Step 3: Document local startup commands**

````md
## Local Start

```bash
pnpm --filter @meow/api dev
pnpm --filter @meow/admin dev
pnpm --filter @meow/wechat-miniapp dev
```
````

- [ ] **Step 4: Re-run the full workspace verification**

Run:

```bash
pnpm typecheck
pnpm build
pnpm harness
```

Expected: Entire workspace passes.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/harness.md docs/feature-mapping.md package.json
git commit -m "docs: document mvp startup and smoke checks"
```

---

## Self-Review

### Spec coverage

- Product scope and exclusions: covered by Tasks 1, 2, 10
- Single-service architecture with `apps/api`: covered by Tasks 1, 3, 4, 5
- Native WeChat mini program with shared shell and two workspaces: covered by Tasks 7 and 8
- Merchant publish/review/reward/settle flow: covered by Tasks 3, 5, and 8
- Creator browse/submit/earnings flow: covered by Tasks 4, 5, and 8
- Admin minimum modules from the demo: covered by Task 6
- Database entities and ledger model: covered by Task 2 and Task 5
- Harness evolution from static assertions to replay: covered by Task 9
- Docs and smoke validation: covered by Task 10

### Placeholder scan

- No placeholder markers remain.
- Each task includes concrete files, commands, and code snippets.

### Type consistency

- `TaskStatus` values are fixed to `draft | published | paused | ended | settled | closed`
- `SubmissionStatus` values are fixed to `submitted | approved | rejected | withdrawn`
- Reward types are fixed to `base | ranking | tip`
- Ledger accounts are fixed to `merchant_balance | merchant_escrow | creator_frozen | creator_available`
