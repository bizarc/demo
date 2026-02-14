# Roadmap

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Design System & UI | Complete |
| Phase 1 | Core Implementation | Complete |
| Phase 2 | Polish & Deploy | Complete |
| Phase 3 | Platform Expansion & Intelligence | In Progress |

---

## Phase 0 — Design System & UI (Complete)

Established the foundational design system, implemented 23 UI components, and defined the visual language based on a Palantir AIP-inspired enterprise aesthetic.

### Deliverables
- CSS custom property token system (colors, typography, spacing)
- 23 reusable UI components in `src/components/ui/`
- Component API definitions (props, variants, sizes, states)
- Tailwind CSS v4 integration with custom `@theme` mapping

---

## Phase 1 — Core Implementation (Complete)

Built the end-to-end demo creation and chat experience.

### 1.1 Database Setup
- Supabase tables: `demos`, `leads`, `sessions`, `messages`, `rate_limits`
- Row Level Security policies
- Auto-updating `updated_at` trigger

### 1.2 Web Scraping
- Cheerio-based scraper with Jina AI fallback
- Extracts: company name, industry, products, offers, logo, colors
- Rate limited (5 req/min)

### 1.3 Demo Builder (5-Step Wizard)
- Step 1: Mission Profile selection
- Step 2: URL scraping and context extraction
- Step 3: Context review (products, offers, qualifications)
- Step 4: Model selection (OpenRouter)
- Step 5: Preview and launch

### 1.4 AI Chat
- Streaming chat via OpenRouter (SSE)
- Mission-specific system prompts with template variables
- Token tracking and rate limiting

### 1.5 External Demo Experience
- Branded chat interface at `/demo/[id]`
- Dynamic branding (logo, colors, company name)
- Lead tracking (anonymous via nanoid)
- Conversation persistence across refreshes

### 1.5+ Draft Autosave, Live Preview, LAB Home
- Draft autosave with debounced PATCH
- Live chat preview in Step 5 (builder)
- LAB home page with demo list, status management
- URL-based routing for draft resume (`/lab/[id]`)

### 1.10 End-to-End Verification & Polish
- Full flow verification (Builder → Success → Chat → DB)
- Mobile responsiveness (builder, home, success, chat)
- UI animations and focus states

---

## Phase 2 — Polish & Deploy (Complete)

### 2.1 Testing & Component Documentation (Complete)
- [x] Storybook setup with 65+ stories for all 23 components
- [x] Vitest unit tests for utilities and 3 UI components
- [x] Interaction tests for 7 key components
- [x] Integration tests for API routes
- [x] E2E tests with Playwright

### 2.2 Error Handling
- [x] Error boundary component
- [x] Custom 404 page
- [x] Expired demo page with operator contact
- [x] Toast notifications for user feedback
- [x] Retry logic for failed API calls

### 2.3 Performance
- [x] Image optimization (logos, assets)
- [x] Skeleton loading states for data fetching
- [x] Add loading states to all buttons
- [x] Core Web Vitals measurement and optimization

### 2.4 Security
- [x] CORS configuration
- [x] Rate limiting enforcement on all routes
- [x] Supabase RLS audit
- [x] Input sanitization review

### 2.5 Deployment
- [x] Vercel deployment configuration
- [x] Environment variable setup
- [x] Preview builds for PRs
- [x] Production deployment
- [x] Smoke test all critical paths

---

## Phase 3 — Platform Expansion & Intelligence (In Progress)

> Features under consideration for LAB demo functionality, BLUEPRINT production flows, or both. Each item requires research and design before implementation.

### 3.1 Home & Auth
- **Home page** — Landing screen supporting LAB, existing demos, future modules
- **Authentication** — Internal users (Super Admin, Operator) + External users (Client Viewer)
- **RBAC** — Separate internal vs. client workspaces
- **Data integrity** — Optimistic locking, audit trails, Push-to-BLUEPRINT action

### 3.2 Research Skill (Company Intelligence)
AI-powered company research via Perplexity (OpenRouter), implemented as part of **RECON**. POST/GET `/api/research`; "Run AI Research" in LAB builder Step 3 enriches context. Research can be auto-run or on-demand and consumed by RADAR, THE LAB, and BLUEPRINT.

### 3.3 Improved Scraping & Context Generation
Completed: multi-page crawling, structured extraction (products, pricing, FAQs), and logo/color improvements. Output is designed to merge with RECON research context.

### 3.4 Advanced Prompt Engineering (Missions x Channels)
Detailed prompt templates per mission (Reactivation, Nurture, Service, Review) crossed with channel (SMS, Voice, Website Chat, Messenger). Includes tone, length, CTA style, and compliance.

### 3.5 Knowledge Bases (RAG)
Completed for LAB scope: mission-specific knowledge stores with Supabase pgvector, ingestion flow, and retrieval integration. Next step is RECON alignment for workspace-scoped reuse in RADAR and BLUEPRINT.

### 3.7 RECON (Shared Intelligence Module)
RECON is the shared intelligence module for client/workspace-scoped research and knowledge assets.

- Shared research records and reusable knowledge bases across modules
- RADAR uses RECON context for personalized campaigns
- THE LAB reads and enriches RECON during demo creation
- BLUEPRINT consumes approved RECON assets for production deployments
- Governance roadmap: versioning, promotion states, and RBAC-scoped access

### 3.6 Voice AI Demos
Voice AI demo architecture per mission. Evaluate providers (ElevenLabs, OpenAI TTS/STT, Deepgram). Browser-based and/or phone call UX.

---

## Product Context

THE LAB fits within the larger **Funnel Finished** platform lifecycle:

```
RADAR (Prospecting)
    ↓
THE LAB (Sales Demos)    ← You are here
    ↓
BLUEPRINT (Production Config)
    ↓
MISSION CONTROL (Operations)
    ↓
CLIENT PORTAL (Retention)
```
