# RALPLAN: 使用 shadcn/ui 重构 admin 和 web

## Requirements Summary

使用 shadcn/ui 组件库重构 meow 项目的 admin 和 web 两个应用，将现有的自定义 CSS 组件迁移到 shadcn/ui + Tailwind CSS 体系，同时保持现有功能、路由和视觉风格不变。

## Acceptance Criteria

1. [ ] Both apps build successfully with `pnpm build`
2. [ ] All existing tests pass (`pnpm test` in both apps)
3. [ ] Visual regression: all screens match existing design (blue theme, rounded corners, glassmorphism)
4. [ ] Routing preserved: all existing routes work correctly
5. [ ] Components migrated: all custom components replaced with shadcn equivalents
6. [ ] Theme configured: Tailwind + shadcn theme matches existing color system

## Implementation Steps

### Phase 0: Preparation & Baseline

**Step 0.1: Visual Baseline Documentation**
- Capture current state: Take screenshots of key screens in web app
- Document exact CSS variable values from styles.css
- Document gradient patterns, shadows, border-radius values
- **Files**: `.omx/reference/web-theme-baseline.md`

**Step 0.2: Create Shared Theme Contract**
- Create root-level theme documentation
- Define CSS variable mapping to Tailwind theme
- Document color palette, typography, spacing tokens
- **Files**: `THEME.md` (repo root)

### Phase 1: Web App Migration (FIRST - De-risk before admin)

**Step 1.1: Initialize Tailwind CSS in web app**
- Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`
- Create `tailwind.config.js` with custom theme matching current CSS variables
- Create `postcss.config.js`
- Replace `styles.css` with Tailwind directives + custom CSS variables
- **Files**: `apps/web/tailwind.config.js`, `apps/web/postcss.config.js`, `apps/web/src/styles.css`

**Step 1.2: Initialize shadcn/ui in web app**
- Run `npx shadcn@latest init --template vite` in `apps/web/`
- Configure for React + TypeScript + Vite
- Set base color to "slate" (close to current blue theme)
- **Files**: `apps/web/components.json`, `apps/web/src/lib/utils.ts`

**Step 1.3: Install shadcn components for web**
Components needed:
- `button` - primary-button, secondary-button
- `card` - task-card variants
- `input` - form fields
- `label` - form labels
- `badge` - login-badge, meta-pill
- `tabs` - bottom-tab-bar, shell-nav
- `separator` - task-footer borders
- `scroll-area` - mobile-content scroll
- `dialog` - modal replacements
- `sheet` - mobile side panels
- **Command**: `npx shadcn add button card input label badge tabs separator scroll-area dialog sheet`

**Step 1.4: Migrate web custom components to shadcn**
- `AppShell.tsx` -> Use Card + layout components
- `BottomTabBar.tsx` -> Use Tabs component
- `MobileShell.tsx` -> Use Sheet + Card
- `RoleSwitch.tsx` -> Use Badge + Switch
- `TaskCard.tsx` -> Use Card component
- `TopBar.tsx` -> Use Card + Button
- **Files**: `apps/web/src/components/*.tsx`

**Step 1.5: Update web App.tsx**
- Import shadcn components
- Replace layout divs with Card/Separator/Sheet
- Verify React Router integration intact
- **File**: `apps/web/src/App.tsx`

**Step 1.6: Web App Verification**
- Run `pnpm typecheck` - fix any errors
- Run `pnpm test` - ensure tests pass
- Run `pnpm build` - ensure build succeeds
- Visual check: Login screen, task cards, navigation match baseline
- **Decision point**: If theme fidelity is unacceptable, reassess before admin

### Phase 2: Admin App Migration (AFTER web is verified)

**Step 2.1: Initialize Tailwind in admin app**
- Reuse theme values from web app (copy tailwind.config.js, adapt if needed)
- Install same dependencies
- **Files**: `apps/admin/tailwind.config.js`, `apps/admin/postcss.config.js`, `apps/admin/src/styles.css`

**Step 2.2: Initialize shadcn/ui in admin app**
- Run `npx shadcn@latest init --template vite` in `apps/admin/`
- **Files**: `apps/admin/components.json`, `apps/admin/src/lib/utils.ts`

**Step 2.3: Install shadcn components for admin**
Components needed:
- `button`, `card`, `input`, `label`, `badge`
- `sidebar` - admin sidebar navigation (validate fits persistent pattern)
- `navigation-menu` - header navigation
- `table` - data tables
- `dialog` - modals
- `dropdown-menu` - user menu
- `avatar` - user avatars
- **Command**: `npx shadcn add button card input label badge sidebar navigation-menu table dialog dropdown-menu avatar`

**Step 2.4: Migrate admin custom components**
- `AdminLayout.tsx` -> Use Sidebar + layout
- `Header.tsx` -> Use NavigationMenu + Avatar + DropdownMenu
- `Sidebar.tsx` -> Use Sidebar component
- **Files**: `apps/admin/src/components/*.tsx`

**Step 2.5: Update admin App.tsx**
- Import shadcn components
- Replace layouts
- **File**: `apps/admin/src/App.tsx`

**Step 2.6: Admin App Verification**
- Same checks as web app (typecheck, test, build)
- Visual check: Admin layout, sidebar, header match expected design

### Phase 3: Final Verification & Documentation

**Step 3.1: Cross-app Theme Consistency**
- Verify both apps use same color values
- Compare visual output side-by-side
- Document any intentional differences

**Step 3.2: Update Documentation**
- Update THEME.md with any adjustments made
- Document component mapping (old -> new)
- Add shadcn usage guidelines

**Step 3.3: Monorepo Build Verification**
- Run `pnpm build` from root (turborepo)
- Verify both apps build together
- Check for any workspace dependency issues

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Theme fidelity issues (glassmorphism/gradients) | Medium | High | Phase 0 baseline, Step 1.6 verification gate |
| Tailwind class conflicts with existing CSS | Medium | Medium | Keep custom CSS variables during transition, migrate incrementally |
| Component API differences break functionality | Low | High | Test each component after migration, keep business logic separate |
| shadcn sidebar doesn't fit admin persistent pattern | Medium | Medium | Validate in Step 2.3 before committing |
| React Router integration issues | Low | High | Test navigation early in Step 1.5 |
| Chinese typography issues | Low | Low | Preserve font-family stack in Tailwind config |

## RALPLAN-DR Summary

### Principles
1. **Preserve first, enhance second**: Keep existing functionality and UX intact
2. **Component-for-component**: Each custom component maps to a shadcn equivalent
3. **Theme continuity**: Existing blue gradient theme maps exactly to new system
4. **Incremental verification**: Test each phase before proceeding
5. **De-risk through sequencing**: Web app first, verify, then admin
6. **Document the contract**: Theme values codified in THEME.md

### Decision Drivers (Top 3)
1. **Design consistency**: shadcn/ui provides battle-tested, accessible components
2. **Developer velocity**: Pre-built components reduce custom CSS maintenance
3. **Community/ecosystem**: shadcn integrates with Tailwind ecosystem, large community

### Viable Options

**Option A: Direct shadcn migration, sequential apps (CHOSEN)**
- Install shadcn/ui in each app
- Migrate web first, verify, then admin
- **Pros**: Full shadcn ecosystem, TypeScript support, de-risked through sequencing
- **Cons**: More dependencies per app, some setup overhead

**Option B: Shared UI package with shadcn**
- Create `@meow/ui` package with shadcn components
- Both apps import from shared package
- **Pros**: Single source of truth, smaller bundle per app
- **Cons**: More complex monorepo setup, shadcn harder to customize per-app
- **Why rejected**: Current component count is small (~9 total), overhead not justified

**Option C: Manual Tailwind migration without shadcn**
- Write custom Tailwind components mimicking current CSS
- **Pros**: No external dependencies, full control
- **Cons**: Reinventing wheel, no accessibility built-in, higher maintenance
- **Why rejected**: shadcn provides proven accessible patterns

**Option D: Keep custom CSS, refactor only**
- Systematically extract CSS variables, defer shadcn
- **Pros**: Lowest risk, no dependency changes
- **Cons**: Still maintaining custom CSS, doesn't solve long-term maintainability
- **Why rejected**: Doesn't address the root problem (400 lines of unmaintainable CSS)

## ADR

### Decision
Migrate both web and admin apps from custom CSS to shadcn/ui + Tailwind CSS:
- Sequential approach: web first, then admin
- Per-app shadcn installations (not shared package)
- Theme contract documented in root THEME.md

### Drivers
- Current custom CSS is ~400 lines, becoming hard to maintain
- No component reusability between apps
- shadcn/ui provides accessible, tested components
- Design system needs consistency

### Alternatives Considered
- **Shared UI package**: rejected due to small component count
- **Manual Tailwind only**: rejected due to accessibility/maintenance burden
- **Other component libraries**: rejected - shadcn has better React 18 + Vite integration
- **Defer migration**: rejected - doesn't solve root maintainability issue

### Why Chosen
shadcn/ui is headless + Tailwind based, giving us full styling control while providing proven component patterns. It matches our existing tech stack (React 18, TypeScript, Vite). Sequential approach de-risks theme mapping.

### Consequences
- **Positive**: Consistent accessible UI, faster iteration, community support
- **Negative**: Additional dependency management, learning curve for team

### Follow-ups
- Document component usage patterns
- Consider visual regression testing (Storybook + Chromatic or Playwright)
- Create shadcn component usage guidelines
- Monitor for theme drift between apps

---

## Available-Agent-Types Roster

| Role | Capability | Fit for this task |
|------|-----------|-------------------|
| `executor` | Code implementation | High - main implementation role |
| `style-reviewer` | CSS/Tailwind review | High - theme verification |
| `test-engineer` | Test strategy | Medium - for test updates |
| `code-reviewer` | Comprehensive review | High - final pass |
| `verifier` | Completion validation | High - end verification |

## Follow-up Staffing Guidance

### For `$ralph` execution
- Primary: `executor` with reasoning=high for component migration
- Secondary: `style-reviewer` with reasoning=high for theme fidelity
- Support: `test-engineer` for test migration

### For `$team` execution
- Lane 1: `executor` - web app setup + migration
- Lane 2: `style-reviewer` - theme consistency verification
- Lane 3: `test-engineer` - test verification
- Lane 4: `verifier` - final build/runtime verification
- **Note**: Sequential dependency - web verification must complete before admin starts

## Team Verification Path

Before team shutdown, must verify:
1. Build succeeds: `pnpm build` passes in both apps
2. Tests pass: `pnpm test` in both apps
3. Type check passes: `pnpm typecheck` in both apps
4. Dev server starts: `pnpm dev` starts without errors
5. Visual check: Login screen renders correctly with theme fidelity
6. THEME.md documents the color system

## Launch Hints

```bash
# Sequential execution via ralph
ralph --plan .omx/plans/shadcn-refactor-admin-web.md

# For team mode (note: has sequential dependency)
omx team --spec .omx/plans/shadcn-refactor-admin-web.md --strategy sequential
```

---

## Architect Review Addendum

### Steelman Antithesis (from Architect)
> The plan underestimates the cost of theme replication. shadcn's default "slate" or "blue" base colors won't match the existing custom gradient system. The migration will require significant custom CSS anyway, negating the "maintenance reduction" benefit.

### Tradeoff Tension
> The tension is between "one blessed way" (shared package, enforced consistency) and "pragmatic duplication" (per-app installs, local autonomy). At 9 components, duplication wins. At 50 components, shared package wins.

### Synthesis Applied
- **Sequential approach**: Web app first to de-risk theme mapping before admin
- **Theme contract**: THEME.md codifies the exact CSS variable mapping
- **Verification gates**: Step 1.6 provides go/no-go decision point
- **Glassmorphism preserved**: Custom CSS for complex gradients stays in styles.css

