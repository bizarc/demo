# Tasks

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

### 1.1 Project Setup ✅
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

### 1.2 Supabase Setup ✅
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

### 1.7a Conversation Engine (leads, sessions, messages) ✅
- [x] Create Supabase migration for `leads`, `sessions`, `messages` tables
  - [x] `leads`, `sessions`, `messages` schemas
  - [x] RLS policies and Indexes
  - [x] **Run migration in Supabase SQL Editor** (Verified)
- [x] Update `database.types.ts`
- [x] Refactor `POST /api/chat` to be session-aware
  - [x] Handle anonymous users (leads)
  - [x] Store message history
  - [x] Token tracking updates
- [x] Fix builder preview to send client-side history
- [x] Test: Conversation context persists across messages

### 1.8 Magic Link Display (`src/app/lab/success/page.tsx`) ✅
- [x] Display generated magic link URL
- [x] Implement copy-to-clipboard button
- [x] Generate QR code
- [x] Display demo details summary
- [x] Verify QR code scanning on mobile
- [x] Verify magic link redirect works end-to-end

### 1.9 Magic Link Chat (`src/app/demo/[id]/page.tsx`) ✅
- [x] Fetch demo config on load
- [x] Implement branded header
- [x] Implement session-aware chat
  - [x] Anonymous lead creation
  - [x] History persistence
- [x] Implement chat message list & streaming
- [x] Verify chat history loads across refreshes
- [x] Verify streaming responses behavior

### 1.10 End-to-End Verification & Polish ✅
- [x] Verify full flow: Builder -> Success -> Chat -> DB
- [x] Verify mobile responsiveness
- [x] Final UI polish (animations, loading states)

---

## Phase 1.5: Draft Autosave, Live Preview & LAB Home ✅

### 1.5.1 Database Migration (Draft Support)
- [x] Add `status`, `created_by`, `updated_at`, `deleted_at`, `current_step` columns to demos
- [x] Relax NOT NULL constraints for partial draft saves
- [x] Update RLS policies to exclude soft-deleted rows
- [x] Add indexes on `status`, `created_by`, `deleted_at`
- [x] Add `updated_at` trigger

### 1.5.2 Demo API (Draft CRUD)
- [x] POST /api/demo: support `status: 'draft'` (partial save, no validation)
- [x] PATCH /api/demo/[id]: autosave endpoint (partial updates, activation flow)
- [x] DELETE /api/demo/[id]: soft delete (with hard delete option `?hard=true`)
- [x] GET /api/demo: list demos by `created_by`, filterable by status

### 1.5.3 Chat API (Draft Support)
- [x] Skip expiration check when `status === 'draft'`
- [x] Skip token limit check for draft previews
- [x] Skip lead/session/message persistence for draft chats
- [x] Generate system prompt on-the-fly from draft data

### 1.5.4 Autosave Hook
- [x] `useAutosave` hook: debounced save (1s), immediate on step change
- [x] Draft creation after step 1 completion
- [x] Activation flow (draft → active with system prompt + expiration)
- [x] Autosave status indicator in sidebar

### 1.5.5 LAB Routing
- [x] `/lab` = LAB Home (demo list)
- [x] `/lab/new` = New demo builder
- [x] `/lab/[id]` = Resume/edit existing draft
- [x] URL updates from `/lab/new` → `/lab/[id]` after draft creation

### 1.5.6 LAB Home Page
- [x] Demo list grouped/filterable by status (draft, active, expired, blueprint)
- [x] Status badges, relative timestamps, mission profile labels
- [x] Actions: Resume (draft), Open/Copy Link (active), Delete (all)
- [x] Empty state with CTA to create new demo

### 1.5.7 Live Preview (ChatPreview)
- [x] Placeholder on steps 1-4: "Complete all steps to preview your agent"
- [x] Active ChatPreview on step 5 using real draft UUID from DB
- [x] No `previewConfig` or `demoId: 'preview'` — API reads from DB

### 1.5.8 Temporary User Scoping
- [x] `creator_id` in localStorage for draft ownership (pre-auth)
- [x] GET /api/demo filtered by `created_by`

---

## Phase 2: Polish & Deploy

### 2.1 Testing & Component Documentation
- [x] Set up Storybook
  - [x] Install and configure Storybook for Next.js + Tailwind CSS v4
  - [x] Write stories for all design system components (`src/components/ui/`)
  - [x] Document component variants, states, and design tokens
  - [x] Add interaction tests to key stories (Button, Input, Modal, Select, Toggle, Checkbox, Tabs)
- [x] Set up Vitest + React Testing Library (replaces Jest — already bundled with Storybook)
  - [x] Configure unit test project with jsdom environment
  - [x] Unit tests for utility functions (`src/lib/prompts`, `src/lib/creatorId`)
  - [x] Unit tests for UI components (Button, Input, Badge)
- [x] Integration tests for API routes
  - [x] `/api/demo` (create, list, update, delete)
  - [x] `/api/chat` (streaming, history, token limits)
  - [x] `/api/scrape` (scraping, rate limiting)
- [x] E2E tests with Playwright
  - [x] Test: Create demo flow (builder → success → magic link)
  - [x] Test: Chat experience (streaming, history persistence)
  - [x] Test: Expired demo handling

### 2.2 Error Handling
- [x] Create error boundary component
- [x] Create 404 page
- [x] Create expired demo page
- [x] Add toast notifications for errors
- [x] Implement retry logic for API calls

### 2.3 Performance
- [x] Optimize images (next/image)
- [x] Implement skeleton loaders
- [x] Add loading states to all buttons
- [x] Measure and optimize Core Web Vitals

### 2.4 Security
- [x] Validate all user inputs
- [x] Sanitize scraped content
- [x] Implement CORS properly
- [x] Add rate limiting to all endpoints
- [x] Audit Supabase RLS policies

### 2.5 Deployment
- [x] Configure Vercel project (`vercel.json`, `docs/deployment.md`)
- [x] Set environment variables in Vercel (documented in deployment guide)
- [x] Set up preview deployments (automatic via Git integration)
- [ ] Configure custom domain (optional) — see docs/deployment.md
- [x] Test production build: `npm run build`
- [ ] Deploy to production (manual: connect repo at vercel.com, then push)
- [x] Smoke test all critical paths (Playwright with `BASE_URL` — see docs/deployment.md)

---

## Phase 3: Platform Expansion & Intelligence

> **Scope:** Features under consideration for LAB demo functionality, BLUEPRINT production flows, or both. Each item requires research and design before implementation.

### 3.1 Home & Auth

#### Home Page
- [ ] Design home/landing screen (Stitch or DESIGN.md)
  - Support Funnel Spec v3 use cases: LAB, existing demos, future RADAR/Blueprint/Mission Control
  - Enable access to existing demos (list, manage, open Magic Link)
  - Clear entry points for internal ops vs. client portal
- [ ] Implement home page per design
  - Replace default Next.js template
  - Navigation to /lab (Demo Builder)
  - Demo list / management (when auth exists)

#### Authentication & RBAC
- [ ] Auth for internal users (Super Admin, Operator)
  - Required for LAB, RADAR, Mission Control access
- [ ] Auth for external users (Client Viewer)
  - Required for Client Portal (read-only metrics, billing)
- [ ] RBAC: separate internal vs. client workspaces per Funnel Spec

#### Data Integrity
- [ ] Optimistic locking for concurrent draft edits
- [ ] Audit trail for demo state transitions
- [ ] Push to BLUEPRINT action (set `status = 'blueprint'`, trigger BLUEPRINT flow)

### 3.2 Research Skill (Company Intelligence)
- [ ] Research & design: AI-powered company research via Perplexity (OpenRouter)
  - Determine scope: auto-run during builder flow vs. on-demand operator tool
  - Define output structure (company summary, competitors, market position, offerings)
- [ ] Implement research API route using Perplexity model via OpenRouter
- [ ] Integrate research output into builder context (Step 3) to enrich agent knowledge
- [ ] Evaluate applicability to BLUEPRINT (deeper research for production agents)

### 3.3 Improved Scraping & Context Generation
- [ ] Research & design: enhanced scraping strategy
  - Multi-page crawling (sitemap, linked pages)
  - Structured extraction of products, services, pricing, FAQs
  - Image/logo detection improvements and brand color extraction
- [ ] Implement improved scraper with richer context output
- [ ] Auto-generate structured context from scrape results (products, offers, qualifications)
- [ ] Evaluate combining research skill (3.2) with scrape data for comprehensive context

### 3.4 Advanced Prompt Engineering (Missions x Channels)
- [ ] Research & design: detailed prompts per mission x channel matrix
  - Missions: Reactivation, Nurture, Service, Review
  - Channels: SMS, Voice, Website Chat, Messenger
  - Define tone, length, CTA style, and compliance considerations per channel
- [ ] Implement channel-aware prompt templates
- [ ] Add channel selection to builder flow (Step 1 or new step)
- [ ] Test and iterate prompt quality across all mission/channel combinations
- [ ] Evaluate: demo-only feature vs. BLUEPRINT production requirement

### 3.5 Knowledge Bases (RAG)
- [ ] Research & design: RAG architecture for mission-specific knowledge
  - Use cases: product catalogs, FAQ databases, service menus, review templates
  - Evaluate vector DB options (Supabase pgvector, Pinecone, etc.)
  - Define upload/ingestion flow for operators
- [ ] Implement knowledge base CRUD (create, upload documents, manage)
- [ ] Implement retrieval pipeline (embedding, search, context injection)
- [ ] Integrate knowledge base selection into builder flow
- [ ] Evaluate: demo-only (limited docs) vs. BLUEPRINT (full catalog support)

### 3.6 Voice AI Demos
- [ ] Research & design: Voice AI demo architecture per mission
  - Evaluate providers (ElevenLabs, OpenAI TTS/STT, Deepgram, etc.)
  - Define voice agent UX (browser-based, phone call, or both)
  - Map voice-specific prompt requirements per mission
- [ ] Implement voice demo page (`/demo/[id]/voice` or separate flow)
- [ ] Integrate with existing demo config (brand, context, mission profile)
- [ ] Add voice demo option to builder flow (Step 5 or post-creation)
- [ ] Evaluate: demo-only showcase vs. BLUEPRINT production voice agents

---

## Validation Checklist

Before any commit:
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes (if configured)
- [ ] `npm run test` passes
- [ ] Manual smoke test of affected features
- [ ] Update this task.md with progress
