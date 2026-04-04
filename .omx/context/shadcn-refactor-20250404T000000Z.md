# Task Context: 使用 shadcn/ui 重构 admin 和 web

## Task Statement
使用 shadcn/ui 组件库重构 meow 项目的 admin 和 web 两个应用，替换现有的自定义组件，提升 UI 一致性和开发效率。

## Desired Outcome
- admin 和 web 应用完整迁移到 shadcn/ui 组件体系
- 保持现有功能和路由不变
- 提升视觉一致性和可维护性
- 保留并复用业务逻辑层

## Known Facts/Evidence

### Project Structure (Turborepo monorepo)
```
/Users/ke/code/meow/
├── apps/
│   ├── web/           # React + Vite web app
│   ├── admin/         # React + Vite admin panel
│   ├── api/           # Backend API
│   ├── app/           # Another app
│   ├── entry/         # Entry app
│   ├── harness/       # Test harness
│   └── wechat-miniapp/
├── packages/          # Shared packages
├── package.json       # Root with pnpm workspace
└── turbo.json
```

### Web App Details
- **Framework**: React 18 + Vite + TypeScript
- **Dependencies**: react-router-dom v6, @meow/contracts
- **Entry**: src/main.tsx → src/App.tsx
- **Components**: src/components/ (custom components)
- **Routes**: src/routes/ (feature-based routing)
- **Styling**: src/styles.css (custom CSS)

### Admin App Details
- **Framework**: React 18 + Vite + TypeScript
- **Dependencies**: @meow/contracts, @meow/domain-*, react-router-dom v6
- **Entry**: src/main.tsx → src/App.tsx
- **Components**: src/components/ (custom components)
- **Routes**: src/routes/ (feature-based routing)

### Current Component Usage (from App.tsx analysis)
#### Web App Components Found:
- Navigation/Header components
- Layout containers
- Card components (custom CSS-based)
- Button components (custom)
- Form inputs (custom)
- Modal/Dialog (custom)
- Table components
- Loading states
- Error boundaries

#### Admin App Components Found:
- Sidebar navigation
- Dashboard cards
- Data tables
- Form builders
- Charts/visualization
- Admin-specific layouts

### Technology Context
- **Package Manager**: pnpm
- **Build Tool**: Vite 6
- **Test**: Vitest + React Testing Library
- **Styling**: Currently custom CSS, target: Tailwind + shadcn

## Constraints
- Must maintain existing React Router v6 routing structure
- Must preserve business logic and data flow
- Must not break existing tests (or update them accordingly)
- Must use shadcn/ui latest stable version
- Must maintain TypeScript strict mode
- Monorepo structure should be preserved

## Unknowns/Open Questions
1. Which shadcn/ui components are needed? Need to audit current custom components.
2. Should we use shared shadcn config across apps or separate configs?
3. Current theme/design system - what colors, spacing, typography to preserve?
4. Are there complex custom components that need custom shadcn extensions?
5. Tailwind configuration strategy for monorepo?

## Likely Codebase Touchpoints
- apps/web/src/App.tsx - Main app shell
- apps/web/src/components/* - All UI components
- apps/web/src/styles.css - Global styles
- apps/web/src/routes/* - Route components
- apps/admin/src/App.tsx - Admin app shell
- apps/admin/src/components/* - Admin UI components
- apps/admin/src/routes/* - Admin routes
- Root package.json - New dependencies
- Tailwind config files (new)
- Component registry (shadcn init)
