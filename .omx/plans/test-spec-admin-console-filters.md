# Test Spec: Admin Console Task/User Discovery

## Regression Evidence to Add/Update
- Admin app API wiring test should assert tasks fetches carry keyword/status/page params when the operator changes filters/pagination.
- Admin app API wiring test should assert users fetches carry keyword/role/state/page params when the operator changes filters/pagination.
- UI test should verify result summary and pagination controls render from pagination metadata.
- Existing action wiring assertions remain green after filter state is introduced.

## Verification Commands
- `rtk pnpm --filter @meow/admin test`
- `rtk pnpm --filter @meow/admin build`
- `rtk pnpm --filter @meow/admin lint`
- `rtk pnpm --filter @meow/admin typecheck`
- `rtk pnpm --filter @meow/api test` (only if shared contract/backend touched)

## Risk Focus
- Query-string construction correctness.
- Avoid duplicate fetch loops when filters/page change.
- Keep detail/action flows working after filtered list refreshes.
- Preserve zero-state/loading behavior.
