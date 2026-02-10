# The Lab — Design System
**Stitch Project ID:** 4030290474301711293

---

## 1. Visual Theme & Atmosphere

**Philosophy:** Enterprise-grade, functional, flat design inspired by Palantir AIP Agent Studio.

**Mood:** Professional, trustworthy, high information density. Clean but not sterile — organized precision without unnecessary ornamentation.

**Key Characteristics:**
- Extremely flat UI with minimal shadows
- High-contrast text hierarchy
- Dense but well-organized layouts
- 3-panel layouts for complex configuration screens
- Numbered step wizards for guided workflows

---

## 2. Color Palette

### Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Foundry Blue** | `#2563EB` | Primary actions, active states, links, focus rings |
| **Success Green** | `#0F9D58` | Success states, "Live" badges, online indicators |
| **Warning Amber** | `#F59E0B` | Warnings, pending states |
| **Error Red** | `#EF4444` | Errors, destructive actions, "Expired" badges |

### Neutral Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Canvas** | `#F8F9FA` | Page background |
| **Surface** | `#FFFFFF` | Cards, panels, modals |
| **Border** | `#E5E7EB` | Card borders, input borders, dividers |
| **Border Subtle** | `#F3F4F6` | Hover backgrounds, nested sections |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Text Primary** | `#111827` | Headings, body text |
| **Text Secondary** | `#6B7280` | Descriptions, helper text, labels |
| **Text Muted** | `#9CA3AF` | Placeholders, timestamps, captions |
| **Text Inverse** | `#FFFFFF` | Text on colored backgrounds |

---

## 3. Typography

### Font Families
- **Primary:** Inter (Sans-serif)
- **Monospace:** JetBrains Mono (Code, API keys)

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 36px | Semi-bold (600) | 1.25 | Hero headlines |
| H1 | 30px | Semi-bold (600) | 1.25 | Page titles |
| H2 | 24px | Semi-bold (600) | 1.25 | Section headings |
| H3 | 20px | Medium (500) | 1.35 | Card titles |
| H4 | 16px | Medium (500) | 1.5 | Subsections |
| Body | 14px | Regular (400) | 1.5 | Paragraphs |
| Small | 12px | Regular (400) | 1.5 | Captions, timestamps |

### Guidelines
- **No uppercase headings** — Use sentence case
- Semi-bold for headings, regular for body
- Generous helper text for complex inputs

---

## 4. Component Styles

### Buttons

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| Primary | `#2563EB` | White | None |
| Secondary | White | `#111827` | `1px #E5E7EB` |
| Ghost | Transparent | `#2563EB` | None |
| Destructive | `#EF4444` | White | None |

**Specs:** 6px border-radius, 40px default height, arrow icon for "Continue" actions.

### Inputs

- Full-width with 1px `#E5E7EB` border
- 6px border-radius
- `#9CA3AF` placeholder text
- Blue focus ring (`#2563EB`)
- Red border for error states

### Cards

- White (`#FFFFFF`) background
- 1px `#E5E7EB` border
- 6-8px border-radius
- 16-24px padding
- No heavy shadows (flat design)

**Interactive Card:** Subtle shadow lift + blue border on hover
**Selected Card:** Blue left-border accent

### Badges & Pills

| Type | Background | Text |
|------|------------|------|
| Live | `#D1FAE5` | `#065F46` |
| Draft | `#F3F4F6` | `#6B7280` |
| Expired/Archived | `#FEE2E2` | `#991B1B` |
| Agent Type | `#DBEAFE` | `#1E40AF` |

### Semantic / Derived Tokens

Tokens for common UI patterns. Use these names in implementation.

| Name | Hex | Usage |
|------|-----|-------|
| **Success Background** | `#D1FAE5` | Success icons, Live badge background |
| **Success Text** | `#065F46` | Live badge text |
| **Error Background** | `#FEE2E2` | Error message backgrounds, Expired badge |
| **Error Text** | `#991B1B` | Error text, Expired badge text |
| **Primary Subtle** | `#DBEAFE` | Selected state tint, Agent Type badge |
| **Primary Subtle Text** | `#1E40AF` | Agent Type badge text, selected labels |
| **Primary Highlight** | `#EFF6FF` | Active step sidebar background |

**Naming convention for backgrounds:**
- **Canvas** — Page background
- **Surface** — Cards, panels, modals
- **Border Subtle** — Input backgrounds, nested sections, chips, subtle fills

---

## 5. Layout Patterns

### 3-Panel Layout (Demo Builder)
```
┌─────────┬─────────────────────┬─────────────┐
│ Sidebar │   Main Content      │   Preview   │
│ (Steps) │   (Config Form)     │   (Chat)    │
└─────────┴─────────────────────┴─────────────┘
```

### Step Indicator Sidebar
- Numbered steps (1, 2, 3...)
- Active step: Foundry Blue circle + text
- Completed step: Check icon
- Future step: Gray text

### Top Navigation
- Back arrow + "Back home" label
- Agent avatar + title
- Status badge (Live/Draft)
- Actions on right

---

## 6. Design System Notes for Stitch Generation

When prompting Stitch for new screens, include this block:

```
**DESIGN SYSTEM (REQUIRED):**
- Background: Off-white (#F8F9FA), cards are Pure White (#FFFFFF)
- Borders: Light gray (#E5E7EB) 1px
- Primary: Foundry Blue (#2563EB) for active states and primary buttons
- Success: Green (#0F9D58) for status badges
- Text: Dark charcoal (#111827), descriptions in (#6B7280)
- Font: Inter, no uppercase headings, semi-bold for emphasis
- Shadows: Minimal/none, very flat
- Border Radius: 6-8px
```

---

## 7. Stitch Project Assets

**Project Link:** [The Lab - Design Exploration](https://stitch.withgoogle.com/projects/4030290474301711293)

### Generated Screens

| Screen | Type | Description |
|--------|------|-------------|
| AIP Studio Style Guide | Documentation | Core design system reference |
| Demo Builder Agent Studio View | App Screen | 3-panel demo configuration |
| Prospect Magic Link Chat View | App Screen | Mobile chat experience |
| Magic Link Display Screen | App Screen | QR code + copy link |
| Colors & Palette Storybook | Documentation | Color system |
| Typography Storybook | Documentation | Font system |
| Components Storybook | Documentation | Buttons, inputs, controls |
| Containers Storybook | Documentation | Cards, panels, states |
| Navigation & Layout Storybook | Documentation | Page structures, nav patterns |
| Icons & Badges Storybook | Documentation | Icon library, status indicators |
