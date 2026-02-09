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

### 1.3 Design System Components (`src/components/ui/`)
- [ ] Create `Button` component
  - [ ] Variants: primary, secondary, ghost, destructive
  - [ ] States: default, hover, disabled, loading
  - [ ] Test: Renders all variants correctly
- [ ] Create `Input` component
  - [ ] Variants: default, with icon, with badge, error
  - [ ] Test: Focus states, error display
- [ ] Create `Card` component
  - [ ] Variants: basic, interactive, selected
  - [ ] Test: Hover lift effect
- [ ] Create `Badge` component
  - [ ] Variants: live, draft, archived, type
  - [ ] Test: Correct colors per variant
- [ ] Create `StepIndicator` component
  - [ ] Props: steps[], currentStep, completedSteps[]
  - [ ] Test: Active/completed/future states
- [ ] Create `Avatar` component
  - [ ] Variants: user (initials), agent (icon), with status
  - [ ] Test: Status dot rendering

### 1.4 URL Scraper (`src/lib/scraper.ts` + `src/app/api/scrape/route.ts`)
- [ ] Implement Cheerio-based scraper
  - [ ] Extract: title, meta description, h1, body text
  - [ ] Extract: logo (og:image or favicon)
  - [ ] Extract: Primary colors from CSS/meta
- [ ] Implement Jina AI fallback
  - [ ] Use Jina Reader API for JS-heavy sites
  - [ ] Return structured markdown
- [ ] Create API route `POST /api/scrape`
  - [ ] Input: `{ url: string }`
  - [ ] Output: `{ companyName, industry, products, offers, logoUrl, colors }`
  - [ ] Test: Scrape example.com successfully
- [ ] Add rate limiting (5 calls/minute)
  - [ ] Test: 6th call within 1 minute returns 429

### 1.5 AI Integration (`src/lib/openrouter.ts` + `src/app/api/chat/route.ts`)
- [ ] Create OpenRouter client
  - [ ] Support model selection
  - [ ] Implement streaming responses
- [ ] Create mission profile prompts (`src/lib/prompts.ts`)
  - [ ] Template: Database Reactivation
  - [ ] Template: Inbound Nurture
  - [ ] Template: Customer Service
  - [ ] Template: Review Generation
- [ ] Create API route `POST /api/chat`
  - [ ] Input: `{ demoId, message, history[] }`
  - [ ] Output: Server-sent events (streaming)
  - [ ] Test: Responds with valid AI message
- [ ] Implement token counting for rate limits
  - [ ] Track tokens per demo session
  - [ ] Test: Exceeding 10,000 tokens stops responses

### 1.6 Demo Builder Page (`src/app/lab/page.tsx`)
- [ ] Create 3-panel layout component
  - [ ] Left: Step indicator sidebar
  - [ ] Center: Configuration form
  - [ ] Right: Live chat preview
- [ ] Implement Step 1: Mission Profile
  - [ ] 4 selectable cards (Reactivation, Nurture, Service, Review)
  - [ ] Store selection in form state
- [ ] Implement Step 2: Target Website
  - [ ] URL input with validation
  - [ ] "Scrape" button triggers `/api/scrape`
  - [ ] Display scraped content preview
- [ ] Implement Step 3: Context
  - [ ] Editable fields: products, offers, qualifications
  - [ ] Auto-populated from scrape results
- [ ] Implement Step 4: Model Selection
  - [ ] Dropdown with OpenRouter models
  - [ ] Model info display (cost, speed, context)
- [ ] Implement Step 5: Summary & Create
  - [ ] Review all settings
  - [ ] "Create Demo" saves to Supabase
  - [ ] Redirect to Magic Link Display

### 1.7 Demo API (`src/app/api/demo/route.ts`)
- [ ] Implement `POST /api/demo` - Create demo
  - [ ] Validate all required fields
  - [ ] Generate unique ID (nanoid)
  - [ ] Set expiration (7 days default)
  - [ ] Save to Supabase
  - [ ] Test: Creates demo and returns ID
- [ ] Implement `GET /api/demo/[id]` - Get demo
  - [ ] Check expiration
  - [ ] Return demo config (exclude sensitive data)
  - [ ] Test: Returns 404 for expired demos

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
