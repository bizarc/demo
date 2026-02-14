# Design System

THE LAB uses a token-based design system implemented in CSS custom properties (`globals.css`) and consumed via Tailwind CSS v4 utilities. The canonical source of truth is `DESIGN.md`.

## Colors

### Brand

| Token | Hex | CSS Variable | Tailwind | Usage |
|-------|-----|-------------|----------|-------|
| Primary | `#2563EB` | `--color-primary` | `bg-primary` | Actions, links, focus rings |
| Success | `#0F9D58` | `--color-success` | `bg-success` | Live badges, confirmations |
| Warning | `#F59E0B` | `--color-warning` | `bg-warning` | Pending states, cautions |
| Error | `#EF4444` | `--color-error` | `bg-error` | Destructive actions, errors |

### Neutrals

| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Canvas | `#F8F9FA` | `--color-canvas` | Page background |
| Surface | `#FFFFFF` | `--color-surface` | Cards, panels |
| Border | `#E5E7EB` | `--color-border` | Borders, dividers |
| Border Subtle | `#F3F4F6` | `--color-border-subtle` | Hover fills, nested sections |

### Text

| Token | Hex | CSS Variable | Tailwind | Usage |
|-------|-----|-------------|----------|-------|
| Primary | `#111827` | `--color-text-primary` | `text-foreground` | Headings, body |
| Secondary | `#6B7280` | `--color-text-secondary` | `text-foreground-secondary` | Descriptions |
| Muted | `#9CA3AF` | `--color-text-muted` | `text-foreground-muted` | Placeholders |
| Inverse | `#FFFFFF` | `--color-text-inverse` | — | On colored backgrounds |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success-bg` | `#D1FAE5` | Live badge background |
| `--color-success-text` | `#065F46` | Live badge text |
| `--color-error-bg` | `#FEE2E2` | Error/expired backgrounds |
| `--color-error-text` | `#991B1B` | Error text |
| `--color-primary-subtle` | `#DBEAFE` | Type badge, selected states |
| `--color-primary-highlight` | `#EFF6FF` | Active sidebar step |

## Typography

| Level | Size | Weight | Font |
|-------|------|--------|------|
| Display | 36px | 600 | Inter |
| H1 | 30px | 600 | Inter |
| H2 | 24px | 600 | Inter |
| H3 | 20px | 500 | Inter |
| H4 | 16px | 500 | Inter |
| Body | 14px | 400 | Inter |
| Small | 12px | 400 | Inter |
| Code | 14px | 400 | JetBrains Mono |

## Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 8px | Cards, modals |
| `--radius-full` | 9999px | Pills, badges |

## Components (23 total)

### Core
- **Button** — `primary`, `secondary`, `ghost`, `destructive` variants; `sm`, `md`, `lg` sizes; loading state
- **Input** — Label, error, helper text, left/right icons
- **Card** — `default`, `interactive`, `selected` variants; configurable padding
- **Badge** — `live`, `draft`, `archived`, `type` variants with status dot
- **Avatar** — `user` (initials), `agent` (icon); status dot; `sm`/`md`/`lg`

### Form Controls
- **Select** — Dropdown with search, label, error state
- **Checkbox** — Label, description, indeterminate state
- **Radio** — RadioGroup wrapper with individual Radio items
- **Toggle** — On/off switch with label and description
- **Textarea** — Resizable multi-line input with label/error

### Navigation
- **Tabs** — TabList + Tab + TabPanel compound component
- **Breadcrumbs** — Clickable path with optional icons
- **StepIndicator** — Numbered steps, active/completed/future states
- **TopNav** — Header bar with back, title, status badge, actions
- **Sidebar** — Collapsible with icons, labels, badges, disabled `Soon` entries

### Feedback & Overlays
- **Modal** — Dialog with backdrop, title, footer; `sm`/`md`/`lg`/`xl` sizes
- **Toast** — Context provider + standalone item; `success`/`error`/`warning`
- **Skeleton** — Loading placeholders: text, circular, rectangular
- **Spinner** — SVG loading indicator; `primary`/`white`/`gray`
- **EmptyState** — Icon + message + CTA

### Data Display
- **Divider** — Horizontal/vertical with optional label
- **IconButton** — Icon-only button; `default`/`ghost`/`primary`
- **ChatBubble** — Agent (left) and user (right) message bubbles with typing indicator

## Implementation

Design tokens are defined in `:root` in `src/app/globals.css` and mapped to Tailwind via the `@theme inline` directive. Components consume tokens via Tailwind utility classes (`bg-primary`, `text-foreground`, `border-border`, etc.).

```css
:root {
  --color-primary: #2563EB;
  /* ... */
}

@theme inline {
  --color-primary: var(--color-primary);
  /* ... */
}
```

## Shell layout patterns

### Internal shell

- Structure: `Sidebar` + `TopNav` + page content.
- Use on authenticated internal routes (`/`, `/lab/*`, and future internal modules).
- Sidebar owns section-level navigation. `TopNav` owns page title/subtitle and local actions.

### Public minimal shell

- Use `TopNav` + focused page content, no persistent sidebar.
- Use on public flows like `/demo/*`, `/demo/expired`, and `/login`.

## Sidebar disabled state spec

- Disabled navigation items remain visible for roadmap orientation.
- Visual treatment: reduced contrast + `Soon` badge.
- Behavior:
  - Not clickable
  - `aria-disabled="true"`
  - Do not move focus to unavailable routes
- Copy convention: badge label must be `Soon` (not `Coming soon`) in constrained nav spaces.

## Autosave feedback pattern

- Use compact status copy near progress/steps:
  - `Saving...` (in-progress)
  - `Draft saved` (success)
  - `Save failed, retrying...` (error)
- Status indicator uses semantic colors:
  - warning for in-progress
  - success for saved
  - error for failed/retry
