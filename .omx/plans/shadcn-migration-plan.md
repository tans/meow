# RALPLAN-DR: shadcn/ui 重构 Admin 和 Web 应用

## Plan Summary

**Plan saved to:** `.omx/plans/shadcn-migration-plan.md`

**Scope:**
- 2 applications (apps/web, apps/admin)
- 9 component files to migrate
- Custom design system preservation
- Estimated complexity: MEDIUM

**Key Deliverables:**
1. shadcn/ui initialization for both apps with shared theme
2. Component migration preserving business logic
3. Custom theme matching existing blue/white gradient design
4. All existing tests passing

---

## RALPLAN-DR Summary

### Principles (设计原则)

1. **渐进式迁移 (Incremental Migration)**
   - 保留现有业务逻辑不变
   - 先并行运行，后逐步替换
   - 每步变更后可验证

2. **主题一致性 (Theme Consistency)**
   - 保持现有蓝色主题 (#2f7cf6 accent)
   - 保留大圆角设计 (28-34px radius)
   - 维持玻璃拟态效果
   - 保持中文字体支持

3. **零回归 (Zero Regression)**
   - 所有现有测试必须通过
   - 路由结构保持不变
   - API 契约不变

4. **DRY (Don't Repeat Yourself)**
   - 共享主题配置提取到 workspace 级别
   - 复用 shadcn 组件而非重复实现

### Decision Drivers (决策驱动因素)

| ID | Driver | Weight |
|----|--------|--------|
| D1 | 保持现有视觉设计系统 | High |
| D2 | 最小化业务逻辑变更风险 | Critical |
| D3 | 降低未来 UI 开发成本 | High |
| D4 | 保持测试覆盖率 | High |
| D5 | 支持快速迭代开发 | Medium |

### Viable Options (可行选项)

#### Option A: 完全替换 (Full Replacement)
- **描述**: 一次性删除所有自定义 CSS，全面使用 shadcn/ui
- **Pros**: 最纯净的实现，长期维护成本最低
- **Cons**: 风险高，工作量大，可能引入视觉回归
- **Verdict**: ❌ 拒绝 - 风险过高

#### Option B: 渐进式迁移 (Incremental Migration) ⭐ SELECTED
- **描述**: 逐步引入 shadcn/ui，保留并渐进替换自定义样式
- **Pros**: 
  - 风险可控，每步可验证
  - 保留现有设计语言
  - 业务逻辑无需重写
- **Cons**: 
  - 短期存在混合代码
  - 需要额外协调工作
- **Verdict**: ✅ 选择 - 平衡风险与收益

#### Option C: 仅新功能使用 (New Features Only)
- **描述**: 现有组件不变，仅新功能使用 shadcn/ui
- **Pros**: 零风险，工作量小
- **Cons**: 技术债务累积，长期维护两套系统
- **Verdict**: ❌ 拒绝 - 不符合重构目标

### RALPLAN-DR Outcome

**Selected Option: B (渐进式迁移)**

**理由:**
1. 符合 "保持现有行为" 的工作约定
2. 允许在验证过程中逐步调整
3. 支持锁定行为后进行清理
4. 最符合 D1-D4 驱动因素

---

## ADR: Tailwind CSS 采用决策

### Status
Accepted

### Context
当前项目使用自定义 CSS 变量和纯 CSS 样式。引入 shadcn/ui 需要 CSS 工具类支持。

### Decision
采用 Tailwind CSS v4 作为样式基础，配合 shadcn/ui。

### Drivers
- shadcn/ui 组件依赖 Tailwind CSS
- Turborepo 支持 Tailwind 共享配置
- 原子化 CSS 与现有组件化架构契合

### Alternatives Considered

| Alternative | Decision | Reason |
|-------------|----------|--------|
| 保持纯 CSS | ❌ | shadcn/ui 不兼容 |
| CSS Modules | ❌ | 与 shadcn/ui 集成复杂 |
| Tailwind v3 | ❌ | v4 性能更好，配置更简单 |
| Tailwind v4 | ✅ | 推荐版本，Vite 原生支持 |

### Consequences
- **Positive**: 
  - 获得完整的 shadcn/ui 组件生态
  - 样式可预测性提升
  - 构建时 purge 减少 CSS 体积
- **Negative**: 
  - 构建配置变更
  - 团队学习成本
  - 需要适配现有设计 token

### Follow-ups
- 创建自定义 Tailwind 预设匹配现有 CSS 变量
- 文档化设计 token 映射关系

---

## ADR: 主题共享策略

### Status
Accepted

### Context
两个应用 (web, admin) 共享相似的蓝色主题设计系统。

### Decision
创建 workspace 级别的共享 Tailwind 预设和 shadcn 主题配置。

### Implementation
```
packages/
  ui-theme/
    - tailwind.preset.ts    # 共享 Tailwind 配置
    - shadcn-theme.json   # shadcn 主题变量
    - index.css           # 共享基础样式
```

### Drivers
- DRY 原则
- 确保品牌一致性
- 简化未来主题变更

---

## Implementation Plan

### Phase 1: 基础设置 (Foundation)

#### 1.1 Web App - shadcn/ui 初始化
**Files:**
- `apps/web/package.json` - 添加依赖
- `apps/web/vite.config.ts` - 配置 Tailwind
- `apps/web/src/index.css` - 替换入口样式
- `apps/web/components.json` - shadcn 配置
- `apps/web/src/lib/utils.ts` - 工具函数

**Components to install:**
- button
- card
- badge
- input
- separator
- sheet (mobile nav)
- tabs

**Acceptance Criteria:**
- [ ] `pnpm dev` 启动无错误
- [ ] Tailwind IntelliSense 正常工作
- [ ] 基础按钮样式可渲染

#### 1.2 Admin App - shadcn/ui 初始化
**Files:**
- `apps/admin/package.json` - 添加依赖
- `apps/admin/vite.config.ts` - 配置 Tailwind
- `apps/admin/src/index.css` - 替换入口样式
- `apps/admin/components.json` - shadcn 配置

**Components to install:**
- button
- card
- badge
- input
- separator
- sidebar
- navigation-menu
- avatar

**Acceptance Criteria:**
- [ ] `pnpm dev` 启动无错误
- [ ] 与 web 应用共享主题配置

### Phase 2: 主题迁移 (Theme Migration)

#### 2.1 创建共享主题包
**Files:**
- `packages/ui-theme/package.json`
- `packages/ui-theme/tailwind.preset.ts`
- `packages/ui-theme/src/colors.ts`
- `packages/ui-theme/src/typography.ts`
- `packages/ui-theme/src/border-radius.ts`

**Design Token Mapping:**

| Existing CSS Variable | Tailwind/shadcn |
|----------------------|-----------------|
| `--accent: #2f7cf6` | `primary: 217 91% 57%` |
| `--accent-strong: #1f64d1` | `primary-foreground` |
| `--text: #183153` | `foreground` |
| `--muted: #6882a3` | `muted-foreground` |
| `--surface: rgba(255,255,255,0.92)` | `card` |
| `--radius-2xl: 34px` | `radius: 2rem` |
| `--radius-xl: 28px` | `--radius: 1.75rem` |

**Acceptance Criteria:**
- [ ] 颜色映射在两端一致
- [ ] 圆角效果匹配设计
- [ ] 中文字体正常显示

### Phase 3: Web 组件迁移 (Component Migration)

#### 3.1 AppShell → shadcn Shell
**Current:** 自定义 shell 结构
**Target:** shadcn Card + custom layout

**Changes:**
```typescript
// Before
<div className="app-shell">
  <header className="shell-header">...</header>
</div>

// After
<div className="min-h-screen p-5">
  <div className="mx-auto max-w-[980px] space-y-4">
    <Card className="rounded-[28px] border-[rgba(55,111,199,0.16)] bg-white/88">
      <CardHeader>...</CardHeader>
    </Card>
  </div>
</div>
```

**Acceptance Criteria:**
- [ ] 布局结构保持一致
- [ ] RoleSwitch 功能正常
- [ ] 导航项正常显示

#### 3.2 TaskCard → shadcn Card
**Changes:**
- 使用 Card, CardHeader, CardContent, CardFooter
- 保留 `.task-card--feed` 的视觉变体
- Badge 替换自定义 eyebrow

**Acceptance Criteria:**
- [ ] 卡片视觉一致
- [ ] 悬停效果保持
- [ ] 响应式正常

#### 3.3 RoleSwitch → shadcn Button
**Changes:**
- Button variant="secondary" + 自定义样式
- 保留切换逻辑不变

#### 3.4 BottomTabBar → shadcn Tabs
**Changes:**
- Tabs 组件替代自定义 nav
- 保留 React Router NavLink 集成

#### 3.5 MobileShell → shadcn Sheet (移动端)
**Changes:**
- 移动端导航使用 Sheet 组件
- 保留 device 模拟效果

#### 3.6 TopBar → shadcn Header Pattern
**Changes:**
- 保留布局结构
- 使用 Button 替换自定义按钮

### Phase 4: Admin 组件迁移

#### 4.1 AdminLayout → shadcn Sidebar
**Changes:**
- 使用 shadcn Sidebar 组件
- 保留导航逻辑

#### 4.2 Sidebar → shadcn Navigation
**Changes:**
- NavigationMenu 或自定义 Sidebar 变体
- 保留 nav items 数据结构

#### 4.3 Header → shadcn Header Pattern
**Changes:**
- 使用 Card 作为 header 容器
- Badge 组件替换 header-chip

### Phase 5: 验证与清理 (Verification)

#### 5.1 测试验证
**Command:**
```bash
pnpm test --filter=@meow/web
pnpm test --filter=@meow/admin
```

**Acceptance Criteria:**
- [ ] 所有测试通过
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告

#### 5.2 视觉回归检查
**Checklist:**
- [ ] Login 页面样式
- [ ] Web 工作台布局
- [ ] Admin 后台布局
- [ ] 移动端视图
- [ ] 响应式断点

#### 5.3 构建验证
**Command:**
```bash
pnpm build --filter=@meow/web
pnpm build --filter=@meow/admin
```

#### 5.4 清理遗留样式
**Files to review:**
- `apps/web/src/styles.css` - 移除已迁移的类
- `apps/admin/src/` - 检查是否有内联样式需要迁移

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 视觉回归 | Medium | Medium | 渐进式迁移 + 截图对比 |
| 测试失败 | Low | High | 每阶段验证 |
| 构建配置冲突 | Medium | Medium | 先在 web 验证 |
| 性能退化 | Low | Medium | 监控 bundle 大小 |

---

## Appendix: shadcn Component Mapping

### Web App

| Custom Component | shadcn Components |
|------------------|-------------------|
| AppShell | Card, Separator |
| TaskCard | Card, Badge |
| RoleSwitch | Button |
| BottomTabBar | Tabs |
| MobileShell | Sheet (optional) |
| TopBar | Card, Button |

### Admin App

| Custom Component | shadcn Components |
|------------------|-------------------|
| AdminLayout | Sidebar |
| Sidebar | Sidebar, NavigationMenu |
| Header | Card, Badge |

---

## Rollback Plan

如需回滚：
1. Git revert 相关 commit
2. 恢复原始 styles.css
3. 移除 shadcn 依赖
4. 验证应用正常启动

