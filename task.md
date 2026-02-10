# THE LAB — Task Tracker

> **Usage:** Mark tasks `[x]` when complete, `[/]` when in progress.  
> **Validation:** All code must pass lint + tests before commit.

---

## Phase 0: Design System & UI ✅

- [x] Research Stitch skills
- [x] Generate design system options (A, B, C)
- [x] Create app screen mockups
- [x] Create Storybook component screens
- [x] Create `DESIGN.md`

**Stitch Project:** [The Lab - Design Exploration](https://stitch.withgoogle.com/projects/4030290474301711293)

---

## Phase 1: Core Implementation

### 1.1 Project Setup
- [x] Initialize Next.js 14 project with App Router
  - [x] Run `npx create-next-app@latest --typescript --tailwind --eslint`
  - [x] Verify dev server starts: `npm run dev`
- [x] Configure Tailwind with design tokens from `DESIGN.md`
  - [x] Add custom colors (Foundry Blue, Success Green, etc.)
  - [x] Add Inter font via `next/font`
- [x] Set up project structure per `IMPLEMENTATION_PLAN.md`
  - [x] Create `src/components/ui/`, `src/components/lab/`, `src/components/demo/`
  - [x] Create `src/lib/` for utilities
- [x] Configure environment variables
  - [x] Create `.env.local.example` with required vars
  - [x] Document: `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`

### 1.2 Supabase Setup
- [x] Create Supabase project
- [x] Create `demos` table
  - [x] Schema: id, created_at, expires_at, company_name, industry, website_url, products_services, offers, qualification_criteria, logo_url, primary_color, secondary_color, mission_profile, openrouter_model, system_prompt
  - [x] Validate: Run `SELECT * FROM demos LIMIT 1`
- [x] Create `rate_limits` config table
  - [x] Schema: key, value, description
  - [x] Insert defaults: messages_per_demo=50, demos_per_hour=10
- [x] Set up Row Level Security (RLS) policies
- [x] Generate TypeScript types: `npx supabase gen types typescript`

### 1.3 Design System Components (`src/components/ui/`) ✅

#### Core Components
- [x] `Button` — primary, secondary, ghost, destructive + states (hover, disabled, loading)
- [x] `Input` — default, with icon, with badge, error state
- [x] `Card` — basic, interactive (hover), selected (blue accent)
- [x] `Badge` — live, draft, archived, type
- [x] `Avatar` — user (initials), agent (icon), with status dot

#### Form Controls
- [x] `Select` — single select with search
- [x] `Checkbox` — checked/unchecked/indeterminate
- [x] `Radio` — radio group
- [x] `Toggle` — on/off switch
- [x] `Textarea` — multi-line input

#### Navigation
- [x] `Tabs` — horizontal tabs with active state
- [x] `Breadcrumbs` — clickable path navigation
- [x] `StepIndicator` — numbered steps (active/completed/future)
- [x] `TopNav` — header bar with back, title, actions
- [x] `Sidebar` — collapsible with icons/labels

#### Feedback & Overlays
- [x] `Modal` — dialog with backdrop
- [x] `Toast` — notification messages
- [x] `Skeleton` — loading placeholder
- [x] `Spinner` — loading indicator
- [x] `EmptyState` — icon + message + CTA

#### Data Display
- [x] `Divider` — horizontal separator
- [x] `IconButton` — icon-only button
- [x] `ChatBubble` — agent (white) and user (blue) variants

### 1.4 URL Scraper (`src/lib/scraper.ts` + `src/app/api/scrape/route.ts`) ✅
- [x] Implement Cheerio-based scraper
  - [x] Extract: title, meta description, h1, body text
  - [x] Extract: logo (og:image or favicon)
  - [x] Extract: Primary colors from CSS/meta
- [x] Implement Jina AI fallback
  - [x] Use Jina Reader API for JS-heavy sites
  - [x] Return structured markdown
- [x] Create API route `POST /api/scrape`
  - [x] Input: `{ url: string }`
  - [x] Output: `{ companyName, industry, products, offers, logoUrl, colors }`
  - [x] Test: Scrape example.com successfully
- [x] Add rate limiting (5 calls/minute)
  - [x] Test: 6th call within 1 minute returns 429

### 1.5 AI Integration (`src/lib/openrouter.ts` + `src/app/api/chat/route.ts`) ✅
- [x] Create OpenRouter client
  - [x] Support model selection
  - [x] Implement streaming responses
- [x] Create mission profile prompts (`src/lib/prompts.ts`)
  - [x] Template: Database Reactivation
  - [x] Template: Inbound Nurture
  - [x] Template: Customer Service
  - [x] Template: Review Generation
- [x] Create API route `POST /api/chat`
  - [x] Input: `{ demoId, message, history[] }`
  - [x] Output: Server-sent events (streaming)
  - [x] Test: Responds with valid AI message
- [x] Implement token counting for rate limits
  - [x] Track tokens per demo session
  - [x] Test: Exceeding 10,000 tokens stops responses

### 1.6 Demo Builder Page (`src/app/lab/page.tsx`) ✅
- [x] Create 3-panel layout component
  - [x] Left: Step indicator sidebar
  - [x] Center: Configuration form
  - [x] Right: Live chat preview
- [x] Implement Step 1: Mission Profile
  - [x] 4 selectable cards (Reactivation, Nurture, Service, Review)
  - [x] Store selection in form state
- [x] Implement Step 2: Target Website
  - [x] URL input with validation
  - [x] "Scrape" button triggers `/api/scrape`
  - [x] Display scraped content preview
- [x] Implement Step 3: Context
  - [x] Editable fields: products, offers, qualifications
  - [x] Auto-populated from scrape results
- [x] Implement Step 4: Model Selection
  - [x] Dropdown with OpenRouter models
  - [x] Model info display (cost, speed, context)
- [x] Implement Step 5: Summary & Create
  - [x] Review all settings
  - [x] "Create Demo" saves to Supabase
  - [x] Redirect to Magic Link Display

### 1.7 Demo API (`src/app/api/demo/route.ts`) ✅
- [x] Implement `POST /api/demo` - Create demo
  - [x] Validate all required fields
  - [x] Generate unique ID (Supabase UUID)
  - [x] Set expiration (7 days default)
  - [x] Save to Supabase
  - [x] Test: Creates demo and returns ID
- [x] Implement `GET /api/demo/[id]` - Get demo
  - [x] Check expiration
  - [x] Return demo config (exclude sensitive data)
  - [x] Test: Returns 404 for expired demos

### 1.8 Magic Link Display (`src/app/lab/success/page.tsx`)
- [ ] Display generated magic link URL
- [ ] Implement copy-to-clipboard button
  - [ ] Show "Copied!" toast on success
- [ ] Generate QR code (use `qrcode` library)
  - [ ] Download QR as PNG button
- [ ] Display demo details summary
- [ ] "Create Another" and "Edit Demo" buttons

### 1.9 Magic Link Chat (`src/app/demo/[id]/page.tsx`)
- [ ] Fetch demo config on load
  - [ ] Handle expired/invalid demos (error page)
- [ ] Implement branded header
  - [ ] Company logo, name, online status
- [ ] Implement chat message list
  - [ ] Agent bubbles (white, left)
  - [ ] User bubbles (blue, right)
  - [ ] Timestamps
- [ ] Implement suggested prompts
  - [ ] Horizontal scrollable pills
  - [ ] Click to send message
- [ ] Implement message input
  - [ ] Text field + send button
  - [ ] Streaming response display
- [ ] Apply brand colors from demo config

---

## Phase 2: Polish & Deploy

### 2.1 Testing
- [ ] Set up Jest + React Testing Library
- [ ] Unit tests for all UI components
- [ ] Integration tests for API routes
- [ ] E2E tests with Playwright
  - [ ] Test: Create demo flow
  - [ ] Test: Chat experience
  - [ ] Test: Expired demo handling

### 2.2 Error Handling
- [ ] Create error boundary component
- [ ] Create 404 page
- [ ] Create expired demo page
- [ ] Add toast notifications for errors
- [ ] Implement retry logic for API calls

### 2.3 Performance
- [ ] Optimize images (next/image)
- [ ] Implement skeleton loaders
- [ ] Add loading states to all buttons
- [ ] Measure and optimize Core Web Vitals

### 2.4 Security
- [ ] Validate all user inputs
- [ ] Sanitize scraped content
- [ ] Implement CORS properly
- [ ] Add rate limiting to all endpoints
- [ ] Audit Supabase RLS policies

### 2.5 Deployment
- [ ] Configure Vercel project
- [ ] Set environment variables in Vercel
- [ ] Set up preview deployments
- [ ] Configure custom domain (optional)
- [ ] Test production build: `npm run build`
- [ ] Deploy to production
- [ ] Smoke test all critical paths

---

## Validation Checklist

Before any commit:
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes (if configured)
- [ ] `npm run test` passes
- [ ] Manual smoke test of affected features
- [ ] Update this task.md with progress
