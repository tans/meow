# Test Spec — Admin query controls

## Verification target
Prove that the admin UI now exposes usable task/user query controls backed by real API params without regressing current admin flows.

## Regression tests to add/update
1. **Task query flow**
   - log in
   - open task management
   - enter keyword
   - choose status
   - submit / trigger refresh
   - assert fetch hit `/api/admin/tasks` with `page=1`, chosen `status`, and `keyword`
   - assert returned filtered task row renders
   - assert pagination summary renders

2. **Task pagination flow**
   - load page 1 results with total > page size
   - click next page
   - assert fetch hit `/api/admin/tasks` with incremented `page`
   - assert page 2 rows render
   - previous button returns to page 1

3. **User query flow**
   - log in
   - open user management
   - enter keyword
   - choose role and state
   - submit / trigger refresh
   - assert fetch hit `/api/admin/users` with `page=1`, `role`, `state`, and `keyword`
   - assert returned filtered user row renders
   - assert pagination summary renders

4. **User pagination + action survival**
   - paginate users
   - assert correct page fetch occurs
   - on loaded page, existing ban action still renders/works for active non-operator users

5. **Regression sanity**
   - existing admin app wiring test still passes for login/navigation/settings/ledger/action flows

## Command evidence required
- `pnpm --filter @meow/admin test`
- `pnpm --filter @meow/admin build`
- affected-file diagnostics clean

## Non-goals
- visual diff testing
- end-to-end browser automation beyond current component/integration tests
