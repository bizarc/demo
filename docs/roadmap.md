# Roadmap

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Design System & UI | Complete |
| Phase 1 | Core Implementation | Complete |
| Phase 2 | Polish & Deploy | In Progress |
| Phase 3 | Platform Expansion & Intelligence | Planned |

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

## Phase 2 — Polish & Deploy (In Progress)

### 2.1 Testing & Component Documentation (Partial)
- [x] Storybook setup with 65+ stories for all 23 components
- [x] Vitest unit tests for utilities and 3 UI components
- [x] Interaction tests for 7 key components
- [ ] Integration tests for API routes
- [ ] E2E tests with Playwright

### 2.2 Error Handling
- [ ] Error boundary component
- [ ] Custom 404 page
- [ ] Expired demo page with operator contact
- [ ] Toast notifications for user feedback
- [ ] Retry logic for failed API calls

### 2.3 Performance
- [ ] Image optimization (logos, assets)
- [ ] Skeleton loading states for data fetching
- [ ] Lazy loading for heavy components
- [ ] Bundle analysis and code splitting

### 2.4 Security
- [ ] CORS configuration
- [ ] Rate limiting enforcement on all routes
- [ ] Supabase RLS audit
- [ ] Input sanitization review

### 2.5 Deployment
- [ ] Vercel deployment configuration
- [ ] Environment variable setup
- [ ] Preview builds for PRs
- [ ] Production deployment
- [ ] Smoke test all critical paths

---

## Phase 3 — Platform Expansion & Intelligence (Planned)

> Features under consideration for LAB demo functionality, BLUEPRINT production flows, or both. Each item requires research and design before implementation.

### 3.1 Home & Auth
- **Home page** — Landing screen supporting LAB, existing demos, future modules
- **Authentication** — Internal users (Super Admin, Operator) + External users (Client Viewer)
- **RBAC** — Separate internal vs. client workspaces
- **Data integrity** — Optimistic locking, audit trails, Push-to-BLUEPRINT action

### 3.2 Research Skill (Company Intelligence)
AI-powered company research via Perplexity (OpenRouter). Auto-run or on-demand tool producing structured output (summary, competitors, market position).

### 3.3 Improved Scraping & Context Generation
Multi-page crawling, structured extraction (products, pricing, FAQs), image/logo detection improvements, combined with research skill output.

### 3.4 Advanced Prompt Engineering (Missions x Channels)
Detailed prompt templates per mission (Reactivation, Nurture, Service, Review) crossed with channel (SMS, Voice, Website Chat, Messenger). Includes tone, length, CTA style, and compliance.

### 3.5 Knowledge Bases (RAG)
Mission-specific knowledge stores (product catalogs, FAQ databases). Evaluate vector DB options (Supabase pgvector, Pinecone). Document upload/ingestion flow.

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
