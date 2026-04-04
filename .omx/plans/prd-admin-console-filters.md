# PRD: Admin Console Task/User Discovery

## Goal
Expose task and user search/filter/pagination controls in the admin console so operators can find the right records without relying on backend defaults.

## Problem
The backend already supports filtered/paginated admin read APIs, but the admin UI always fetches the default first page and does not expose keyword/status/role/state controls or result counts. This makes the admin console feel incomplete for live operations.

## In Scope
- Task list: keyword search, status filter, pagination, result summary.
- User list: keyword search, role filter, state filter, pagination, result summary.
- Frontend API client updates to accept query params and keep pagination metadata.
- Regression coverage for filter-driven fetches and page transitions.

## Out of Scope
- New backend endpoints.
- Ledger filtering/pagination.
- New governance action types or modal workflows.
- URL routing/state persistence beyond in-memory React state.

## User Stories
1. As an operator, I can filter tasks by status or keyword so I can find the task I need quickly.
2. As an operator, I can page through tasks and see how many results exist.
3. As an operator, I can filter users by role/state/keyword so I can narrow moderation work.
4. As an operator, I keep existing pause/resume/ban flows after filtering and paging.

## Acceptance Criteria
- Task page renders keyword + status controls and requests `/api/admin/tasks` with the chosen query params.
- Task page renders pagination metadata and page controls using response totals.
- User page renders keyword + role + state controls and requests `/api/admin/users` with the chosen query params.
- User page renders pagination metadata and page controls using response totals.
- Existing admin action flows still pass.
- Admin app build/type/test stay green.
