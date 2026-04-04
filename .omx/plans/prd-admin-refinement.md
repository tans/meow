# PRD — Admin query controls

## Goal
Make the admin console usable for real operator review by exposing search, filter, and pagination for task management and user management, using APIs that already exist.

## Problem
The current admin shell proves API wiring but behaves like a fixed demo list:
- task list always loads the default page with no status/keyword controls
- user list always loads the default page with no state/role/keyword controls
- operators cannot narrow large datasets from the UI

## Scope
### In
- task list keyword search
- task list status filter
- task list pagination controls + result summary
- user list keyword search
- user list role filter
- user list state filter
- user list pagination controls + result summary
- loading-safe refresh behavior when filters/page change

### Out
- ledger filtering
- freeform reason dialogs for governance actions
- server/API contract redesign
- routing overhaul

## Users
- operator / admin staff reviewing task and account health

## User stories
1. As an operator, I can search tasks by keyword and filter by status so I can quickly find a specific task.
2. As an operator, I can paginate task results so large lists remain workable.
3. As an operator, I can filter users by role/state and search by keyword so I can locate risky or target accounts.
4. As an operator, I can paginate users and see result counts so I know where I am in the dataset.

## Acceptance criteria
- Tasks page exposes keyword + status controls and re-queries the API with matching params.
- Users page exposes keyword + role + state controls and re-queries the API with matching params.
- Both pages show current totals/page information from API pagination.
- Next/previous paging works and respects loading state.
- Existing governance actions (pause/resume, open detail, ban) still work after data refresh.
- No regression in login/dashboard/settings/ledger flows.

## Risks
- Repeated filter form logic could bloat `App.tsx`; keep boundaries tidy.
- Pagination state must reset safely when filters change.

## Chosen approach
Add narrowly scoped query state and typed API helpers in the admin app, keeping server contracts unchanged.
