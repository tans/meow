# Theme Documentation: Meow Design System

> **Purpose**: Visual baseline for shadcn/ui migration verification  
> **Source**: `apps/web/src/styles.css`  
> **Date**: 2026-04-04

---

## Color Palette

### Primary Blues

| Token | HEX | Usage |
|-------|-----|-------|
| `--accent` | `#2f7cf6` | Primary buttons, active states, links |
| `--accent-strong` | `#1f64d1` | Gradient end, hover states |
| `--accent-soft` | `#dbe9ff` | Active pill backgrounds, light accents |
| `--accent-soft-strong` | `#c8dcff` | Section headers, gradients |

### Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#eaf3ff` | Page background base |
| `--bg-strong` | `#d9eaff` | Stronger background areas |
| `--surface` | `rgba(255, 255, 255, 0.92)` | Cards, panels (glassmorphism) |
| `--surface-strong` | `#ffffff` | Solid surfaces |
| `--surface-soft` | `#f5f9ff` | Soft surface areas |

### Text Colors

| Token | HEX | Usage |
|-------|-----|-------|
| `--text` | `#183153` | Primary text, headings |
| `--muted` | `#6882a3` | Secondary text, labels, meta |

### Semantic Colors

| Token | HEX | Usage |
|-------|-----|-------|
| `--success` | `#2c8a63` | Success states, positive actions |
| `--danger` | `#d14d63` | Error states, destructive actions |

### Lines & Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--line` | `rgba(55, 111, 199, 0.16)` | Subtle borders, dividers |
| `--line-strong` | `rgba(55, 111, 199, 0.28)` | Emphasized borders |

### Gradient Patterns

| Name | Definition | Usage |
|------|------------|-------|
| `body-bg` | `radial-gradient(circle at top left, rgba(69, 142, 255, 0.22), transparent 30%)`, `radial-gradient(circle at bottom right, rgba(145, 188, 255, 0.18), transparent 34%)`, `linear-gradient(180deg, #f8fbff 0%, #eaf3ff 48%, #eef5ff 100%)` | Page background |
| `login-aside` | `radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 36%)`, `linear-gradient(135deg, #327bff 0%, #6ec1ff 100%)` | Login panel header |
| `login-panel` | `linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 249, 255, 0.98))` | Login panel body |
| `primary-button` | `linear-gradient(135deg, var(--accent), var(--accent-strong))` | Primary buttons |
| `section-hero` | `radial-gradient(circle at top right, rgba(255, 255, 255, 0.52), transparent 30%)`, `linear-gradient(135deg, #e3f0ff 0%, #cfe2ff 100%)` | Section headers |
| `profile-hero` | `radial-gradient(circle at top right, rgba(255, 255, 255, 0.52), transparent 34%)`, `linear-gradient(135deg, #eef5ff 0%, #dceaff 100%)` | Profile cards |
| `task-card-feed` | `linear-gradient(135deg, rgba(207, 226, 255, 0.98), rgba(164, 203, 255, 0.98))` | Task card header strip |

---

## Typography

### Font Stack

```css
font-family: "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
```

### Type Scale

| Element | Size | Line Height | Letter Spacing | Weight |
|---------|------|-------------|----------------|--------|
| `.login-title` | 34px | 1.08 | -0.04em | 400 (normal) |
| `.shell-title` | 36px | 1.05 | -0.04em | 400 |
| `.section-title` | 28px | 1.08 | -0.04em | 400 |
| `.task-title` | 22px | 1.18 | -0.03em | 400 |
| `.login-form-header h2` | 24px | 1.12 | -0.03em | 400 |
| `.task-grid--stats .task-title` | 24px | — | — | 400 |
| `.top-bar__title` | 18px | 1.2 | -0.02em | 400 |
| Body | 14-15px | 1.5-1.65 | normal | 400 |
| `.section-copy`, `.task-meta` | 14px | 1.55-1.6 | normal | 400 |
| `.login-lead` | 15px | 1.65 | normal | 400 |
| Labels (`.field label`) | 13px | — | normal | 600 |
| Badges/Pills | 12-13px | — | normal | 700 |
| Kicker (uppercase) | 12px | — | 0.08em | 700 |

### Text Transform

- `.login-kicker`, `.section-kicker`, `.shell-kicker`, `.task-eyebrow`: `uppercase`
- Letter spacing for kickers: `0.08em`

---

## Spacing & Border Radius

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 12px | Small elements, inputs |
| `--radius-md` | 16px | Buttons, badges, inputs |
| `--radius-lg` | 22px | Cards, containers |
| `--radius-xl` | 28px | Large cards, panels |
| `--radius-2xl` | 34px | Shell containers |
| `999px` | — | Pills, badges, buttons (full round) |

### Spacing Patterns

| Context | Value |
|---------|-------|
| Page padding (desktop) | 20px |
| Page padding (mobile) | 10-12px |
| Card padding | 14-24px |
| Card gap | 14px |
| Section gap | 14-18px |
| Grid gap | 10-14px |
| Button padding | 0 12-18px |
| Input padding | 0 16px |

---

## Effects

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow` | `0 24px 60px rgba(32, 85, 165, 0.16)` | Elevated cards, modals |
| `--shadow-soft` | `0 12px 30px rgba(48, 98, 176, 0.12)` | Cards, panels |
| Login panel | `0 30px 80px rgba(40, 88, 163, 0.18)` | Login panel |
| Mobile device | `0 34px 90px rgba(35, 77, 141, 0.18)` | Mobile frame |
| Primary button | `0 14px 28px rgba(47, 124, 246, 0.24)` | Primary buttons |
| Section hero | `0 20px 40px rgba(63, 120, 205, 0.16)` | Hero sections |
| Focus ring | `0 0 0 4px rgba(47, 124, 246, 0.14)` | Input focus |

### Glassmorphism

| Element | Backdrop Filter | Background |
|---------|-----------------|------------|
| `.top-bar` | `blur(16px)` | `rgba(255, 255, 255, 0.82)` |
| `.bottom-tab-bar` | `blur(18px)` | `rgba(255, 255, 255, 0.88)` |
| `.login-badge` | `blur(16px)` | `rgba(255, 255, 255, 0.14)` |
| `.shell-header`, `.shell-main > *` | — | `rgba(255, 255, 255, 0.88)` |

---

## CSS Variable Mapping (Current → Tailwind)

### Colors

| Current Variable | Tailwind Class | HEX Value |
|------------------|----------------|-----------|
| `--bg` | `bg-[#eaf3ff]` | `#eaf3ff` |
| `--bg-strong` | `bg-[#d9eaff]` | `#d9eaff` |
| `--surface` | `bg-white/92` | `rgba(255,255,255,0.92)` |
| `--surface-strong` | `bg-white` | `#ffffff` |
| `--surface-soft` | `bg-[#f5f9ff]` | `#f5f9ff` |
| `--text` | `text-[#183153]` | `#183153` |
| `--muted` | `text-[#6882a3]` | `#6882a3` |
| `--accent` | `bg-blue-500` approx | `#2f7cf6` |
| `--accent-strong` | `bg-blue-600` approx | `#1f64d1` |
| `--accent-soft` | `bg-blue-100` approx | `#dbe9ff` |
| `--success` | `text-green-600` approx | `#2c8a63` |
| `--danger` | `text-red-500` approx | `#d14d63` |

### Border Radius

| Current | Tailwind Equivalent |
|---------|---------------------|
| `--radius-sm: 12px` | `rounded-xl` (12px) or `rounded-[12px]` |
| `--radius-md: 16px` | `rounded-2xl` (16px) |
| `--radius-lg: 22px` | `rounded-[22px]` |
| `--radius-xl: 28px` | `rounded-[28px]` |
| `--radius-2xl: 34px` | `rounded-[34px]` |
| `999px` (pills) | `rounded-full` |

### Shadows

| Current | Tailwind Equivalent |
|---------|---------------------|
| `--shadow` | Custom: `shadow-[0_24px_60px_rgba(32,85,165,0.16)]` |
| `--shadow-soft` | Custom: `shadow-[0_12px_30px_rgba(48,98,176,0.12)]` |

---

## Component Style Reference

### Buttons

#### Primary Button
```css
background: linear-gradient(135deg, var(--accent), var(--accent-strong));
color: #ffffff;
border: none;
border-radius: 999px;
box-shadow: 0 14px 28px rgba(47, 124, 246, 0.24);
min-height: 46px;
padding: 0 18px;
transition: transform 160ms ease, box-shadow 160ms ease;
/* hover: transform: translateY(-1px) */
```

#### Secondary Button
```css
background: rgba(255, 255, 255, 0.8);
color: var(--accent-strong);
border: 1px solid var(--line);
border-radius: 999px;
min-height: 46px;
padding: 0 18px;
```

### Cards

#### Task Card
```css
background: rgba(255, 255, 255, 0.94);
border: 1px solid rgba(84, 137, 214, 0.12);
border-radius: 26px;
box-shadow: var(--shadow-soft);
padding: 18px;
```

#### Task Card (Feed variant)
```css
/* Header strip */
&::before {
  background: linear-gradient(135deg, rgba(207, 226, 255, 0.98), rgba(164, 203, 255, 0.98));
  height: 76px;
}
position: relative;
overflow: hidden;
padding-top: 92px;
```

### Inputs

#### Text Input
```css
background: rgba(246, 250, 255, 0.95);
border: 1px solid rgba(77, 128, 206, 0.18);
border-radius: 16px;
color: var(--text);
min-height: 50px;
padding: 0 16px;

/* Focus state */
border-color: rgba(47, 124, 246, 0.42);
background: #ffffff;
box-shadow: 0 0 0 4px rgba(47, 124, 246, 0.14);
transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
```

### Badges & Pills

```css
background: rgba(255, 255, 255, 0.82);
border: 1px solid rgba(84, 137, 214, 0.14);
border-radius: 999px;
color: var(--muted);
font-size: 12px;
font-weight: 700;
min-height: 34px;
padding: 0 14px;

/* Active state */
&.meta-pill--active {
  background: var(--accent-soft);
  color: var(--accent-strong);
  border-color: rgba(47, 124, 246, 0.16);
}
```

---

## Verification Checklist

### Theme Fidelity Requirements

- [ ] Background gradient matches: radial gradients at corners + linear base
- [ ] Primary buttons use gradient from `#2f7cf6` to `#1f64d1`
- [ ] Cards have `rgba(255,255,255,0.94)` background with subtle border
- [ ] Border radius on cards: 26px (task cards), 28px (shell), 34px (2xl)
- [ ] Shadows use blue-tinted rgba values as specified
- [ ] Glassmorphism elements have `backdrop-filter: blur(16-18px)`
- [ ] Typography uses Avenir Next + Chinese font fallbacks
- [ ] Letter spacing on headings: -0.03em to -0.04em
- [ ] Kickers use `uppercase` with `0.08em` letter spacing

### Migration Notes

1. **Custom CSS Required**: The complex gradient backgrounds (body, login-aside, section-hero) cannot be fully replicated with standard Tailwind utilities and will need custom CSS or `@apply` directives.

2. **Glassmorphism**: Backdrop-filter requires `backdrop-blur-*` utilities; ensure `backdrop-filter` is enabled in Tailwind config.

3. **Border Radius**: Several values (22px, 26px, 28px, 34px, 38px) are non-standard and require custom config or arbitrary values.

4. **Shadows**: All shadows are custom with blue tints; use arbitrary value syntax or extend theme.

5. **Gradients**: Linear and radial gradients with multiple stops require custom CSS or extended Tailwind config.

---

*Document generated for shadcn/ui migration baseline verification.*
