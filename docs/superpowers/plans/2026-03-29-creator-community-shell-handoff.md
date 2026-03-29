# Creator Community Shell Handoff

## Context

- Spec: `/Users/ke/code/meow/docs/superpowers/specs/2026-03-29-creator-community-shell-design.md`
- Plan draft: `/Users/ke/code/meow/docs/superpowers/plans/2026-03-29-creator-community-shell.md`
- Actual runtime baseline decision:
  - Use `apps/wechat-miniapp` root as the only source of truth
  - Do not continue implementation against `apps/wechat-miniapp/miniprogram/**`

## Important Reality Check

The written plan still references many `apps/wechat-miniapp/miniprogram/**` paths.
That is no longer correct for execution.

When continuing:

- edit `apps/wechat-miniapp/app.json`, `app.js`, `app.wxss`
- edit `apps/wechat-miniapp/pages/**`
- keep `apps/wechat-miniapp/miniprogram/**` out of scope unless there is an explicit migration/cleanup task

## Completed So Far

### Task 1 baseline: complete

These commits established the shell baseline:

- `543033c` `feat: define creator community shell`
- `d7ed235` `test: use declared miniprogram root in project config test`
- `43ccc36` `fix: align wechat root runtime shell config`
- `06009a1` `test: enforce tracked root runtime files`

Net effect:

- root runtime now uses 3 tabs: `悬赏大厅 / 获奖作品 / 我的`
- `project.config.json` points at root runtime with `miniprogramRoot: "."`
- root runtime files are tracked in git
- shell model tests and project config tests were added/updated

### Task 2 lobby: mostly implemented, not fully closed

Committed Task 2 work:

- `e31e022` `feat: redesign creator bounty lobby`
- `e7b4336` `fix: harden creator bounty lobby compatibility`
- `93d9fd8` `fix: align lobby channel and public task title mapping`

What is already in committed history:

- root `pages/tasks/**` has community-style lobby UI
- `task-feed` mapper now supports lobby card fields
- backward compatibility fields `badge` / `merchantText` were restored
- channel filtering exists
- `buildPublicTaskListItem()` was introduced in `src/services/tasks.js`

## Current Status At Interruption

There was one more Task 2 follow-up in progress when work stopped.

There are currently uncommitted local changes in:

- `apps/wechat-miniapp/src/services/tasks.js`
- `apps/wechat-miniapp/src/tests/task-feed.test.js`
- `apps/wechat-miniapp/src/view-models/task-feed.js`

These uncommitted changes appear to be a partial fix for the last Task 2 review findings.

### Why Task 2 is not fully signed off yet

The last approved-quality blocker before the interrupted follow-up was:

1. Unknown public tasks should preserve backend-provided lobby fields, instead of being overwritten by generic fallback metadata.
2. `品牌合作` channel matching should be precise enough to include the intended seeded sample task, but not overmatch every merchant-backed task.

The interrupted local diff appears to address exactly those two points:

- `task-feed.test.js`
  - restores exact `品牌合作` expectation
  - adds a test for keeping backend lobby fields on unknown task IDs
- `task-feed.js`
  - removes the overly broad `merchantText.startsWith("商家 ")` predicate
- `tasks.js`
  - switches back to `mergePublicTaskForLobby(...)`
  - introduces fallback derivation for unknown tasks without clobbering backend fields

But:

- this state is not committed
- this state has not been re-reviewed
- `src/services/tasks.js` also contains unrelated local edits in the working tree, so any next commit must be hunk-selected carefully

## Recommended Next Step

Resume from the current dirty worktree and finish Task 2 before starting Task 3.

Suggested sequence:

1. Inspect the current unstaged diff in:
   - `apps/wechat-miniapp/src/services/tasks.js`
   - `apps/wechat-miniapp/src/tests/task-feed.test.js`
   - `apps/wechat-miniapp/src/view-models/task-feed.js`
2. Run:
   - `pnpm --filter @meow/wechat-miniapp test -- task-feed.test.js`
3. If green, stage only the intended Task 2 hunks and create a new commit.
4. Re-run a focused code review on Task 2 scoped to:
   - `apps/wechat-miniapp/src/tests/task-feed.test.js`
   - `apps/wechat-miniapp/src/services/tasks.js`
   - `apps/wechat-miniapp/src/view-models/task-feed.js`
   - `apps/wechat-miniapp/pages/tasks/index.js`
   - `apps/wechat-miniapp/pages/tasks/index.wxml`
   - `apps/wechat-miniapp/pages/tasks/index.wxss`

## After Task 2

Task 3 has not been implemented yet on the root runtime.

Next implementation area should be:

- `apps/wechat-miniapp/pages/workspace/**` -> convert to `获奖作品`
- `apps/wechat-miniapp/pages/profile/**` -> convert to creator-first `我的`
- `apps/wechat-miniapp/pages/wallet/**` -> secondary earnings entry
- `apps/wechat-miniapp/app.wxss` -> shared shell styling update for root runtime

## Known Pitfalls

### 1. Duplicate trees exist

Both of these exist:

- `apps/wechat-miniapp/pages/**`
- `apps/wechat-miniapp/miniprogram/pages/**`

Do not accidentally continue editing the `miniprogram/**` tree for this feature.

### 2. Plan file paths are stale

The plan document is useful for task intent, but many file paths in it still point at `miniprogram/**`.
Use root runtime paths instead.

### 3. `tasks.js` is noisy

`apps/wechat-miniapp/src/services/tasks.js` has unrelated local edits beyond Task 2.
Any next commit touching it should be staged by hunk, not by whole file.

### 4. Working tree is generally dirty

There are many unrelated modified files in API and `miniprogram/**`.
Do not clean them up as part of this feature.

## Handy Commands

Focused Task 2 verification:

```bash
pnpm --filter @meow/wechat-miniapp test -- task-feed.test.js
```

Current shell baseline verification:

```bash
pnpm --filter @meow/wechat-miniapp test -- workspace.test.js project-config.test.js
```

Check current local Task 2 diff:

```bash
git diff -- apps/wechat-miniapp/src/services/tasks.js apps/wechat-miniapp/src/tests/task-feed.test.js apps/wechat-miniapp/src/view-models/task-feed.js
```
