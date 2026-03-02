# THE LAB Demo MVP — Implementation Plan

## Goal
Build a working demo environment where operators can create branded, AI-powered chat demos for prospects. Prospects receive a "Magic Link" to experience a live conversation with an AI agent configured for their business.

---

## Project Phases

**Status:** Phases 0–2 and Phase 3 are complete. Phase 4 (RECON, RADAR, BLUEPRINT module buildout) is next.

### Phase 0: Design System & UI — Complete
Design system (23 UI components), Stitch exploration, approved designs.

### Phase 1: Core Implementation — Complete
Demo builder, Magic Link, chat experience, scraping, OpenRouter integration.

### Phase 2: Polish & Deploy — Complete
Testing (Storybook, Vitest, Playwright), deployment, error handling.

### Phase 3: Platform Expansion & Intelligence — Complete
Home & auth, research skill (Perplexity), context redesign, mission×channel prompts, knowledge bases (RAG).

### Phase 4: Module Buildout (RECON → RADAR → BLUEPRINT) — Next

- **4.1 RECON — Complete.** Shared intelligence module: `/recon` UI for research records and knowledge bases; "Select Existing KB" in Demo Builder; demos reference RECON KBs via `demo_knowledge_bases` (no demo-owned KBs). Lifecycle: draft → reviewed → approved.
- **4.2 RADAR — Planned.** Prospecting engine. Channels (priority): 1 Email, 2 Instagram DMs, 3 LinkedIn messages, 4 everything else (no SMS). **Target acquisition** (from Funnel Finished spec): Google Maps/Places API and LinkedIn scrapers; input e.g. "Roofers in Austin, TX"; output list of targets with phone, email, and "Current Tech Stack" analysis. **Campaign manager:** cold outreach (email, LinkedIn), signal detection. **RECON:** read for personalization; write net-new research and campaign signals.
- **4.3 BLUEPRINT — Planned.** Production config from promoted LAB demos; workspace scoping for client deployments only.

---

## Platform Expansion Direction (Phase 3)

To align with Funnel Finished v3, research and knowledge assets are owned by **RECON**. Internal ops (LAB, RADAR) use permission-level security without workspace scoping. Workspaces are reserved for BLUEPRINT client implementations and client portals.

- **RECON owns intelligence assets**: research records, reusable knowledge bases, and retrieval context.
- **RADAR** consumes and contributes intelligence for prospecting and campaign personalization.
- **THE LAB** is an authoring and demo surface that reads existing RECON assets and can enrich them during demo creation.
- **BLUEPRINT** consumes approved RECON assets when configuring production agents.

Guiding rule: module workflows remain separate, but intelligence assets are shared and referenced from RECON rather than duplicated by default.

---

## Phase 0: Design Work

### Design System Exploration
Use Stitch to generate multiple design system options:
- **Option A**: Apple-minimal with subtle Palantir data density
- **Option B**: Dark command-center aesthetic
- **Option C**: Hybrid light/dark with strong accent colors

### Key Screens to Design
1. **Demo Builder** (THE LAB) — Form for creating demos with URL scraping, Mission Profile selection, model picker
2. **Magic Link Chat** — Prospect-facing branded chat experience (iMessage style)
3. **Magic Link Display** — Generated link with copy button and QR code

### Design Deliverables
- `DESIGN.md` — Design system tokens and guidelines
- Stitch-generated screen mockups for each key screen
- Approved designs before moving to Phase 1

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    THE LAB (Internal)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ URL Scraper │→ │Demo Builder │→ │ Magic Link Generator│ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Demo Experience (External)                     │
│  ┌──────┐  ┌──────┐  ┌──────┐                              │
│  │ Chat │  │Voice │  │ SMS  │  ← Channels                  │
│  └──┬───┘  └──┬───┘  └──┬───┘                              │
│     └─────────┼─────────┘                                  │
│               ↓                                            │
│  ┌─────────────────────────────────────────────┐           │
│  │ Conversation Engine (sessions + messages)   │           │
│  │  → Lead identification                      │           │
│  │  → Unified history across channels          │           │
│  │  → Token tracking & rate limiting           │           │
│  └──────────────────┬──────────────────────────┘           │
│                     ↓                                      │
│  ┌─────────────────────────────────────────────┐           │
│  │ OpenRouter API (Streaming)                  │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 14 (App Router) | Serverless-ready, deploys to Vercel |
| **Styling** | Tailwind CSS | Matches spec, rapid iteration |
| **Backend** | Next.js API Routes | Serverless, periodic usage pattern |
| **Scraping** | Cheerio + Jina fallback | Free, fast, handles most sites |
| **AI** | OpenRouter (user-selectable model) | Flexibility, cost control |
| **Storage** | Supabase (PostgreSQL) | Persistent, real-time capable, generous free tier |
| **Shared Intelligence Ownership** | RECON (platform-global internal) | Reuse across RADAR, THE LAB, and BLUEPRINT |
| **Link Expiration** | 7 days default | Configurable per demo |
| **Rate Limiting** | Configurable from start | Prevent abuse, control costs |

---

## Data Model

```typescript
interface DemoConfig {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  
  // Business Info (scraped/provided)
  companyName: string;
  industry: string;
  websiteUrl: string;
  productsServices: string[];
  offers: string[];
  qualificationCriteria: string[];
  
  // Branding
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  
  // AI Config
  missionProfile: 'reactivation' | 'nurture' | 'service' | 'review';
  openRouterModel: string;
  systemPrompt: string;
}
```

### Conversation Engine (leads, sessions, messages)

Every interaction — chat, voice, SMS — flows through the same conversation engine. A **lead** is a unique person interacting with a demo, identified by phone, email, or anonymous browser fingerprint. Each lead can have multiple **sessions** across channels, and the full history is available to the LLM for context.

```typescript
interface Lead {
  id: string;              // UUID
  demo_id: string;         // FK → demos
  identifier: string;      // email, phone, or anon cookie
  identifier_type: 'email' | 'phone' | 'anonymous';
  display_name?: string;   // extracted from conversation or provided
  created_at: Date;
  last_seen_at: Date;
  metadata: Record<string, unknown>;  // custom attributes
}

interface Session {
  id: string;              // UUID
  lead_id: string;         // FK → leads
  demo_id: string;         // FK → demos
  channel: 'chat' | 'voice' | 'sms' | 'messenger' | 'email' | 'website';
  created_at: Date;
  ended_at?: Date;
  metadata: Record<string, unknown>;  // user agent, device, etc.
}

interface Message {
  id: string;              // UUID
  session_id: string;      // FK → sessions
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: Date;
  token_count: number;
  metadata: Record<string, unknown>;  // voice duration, STT confidence, etc.
}
```

**Key design decisions:**
- Token tracking moves from in-memory `Map` → `SUM(token_count)` on the `messages` table
- Chat API loads a lead's full message history (across sessions) to feed the LLM
- The builder preview uses client-side state only (throwaway, no session needed)
- Client-facing dashboards can show a unified timeline per lead across all channels

---

## Mission Profiles

| Profile | Use Case | Key Prompt Elements |
|---------|----------|---------------------|
| **Database Reactivation** | Re-engage cold leads | Past interest, new offers, urgency |
| **Inbound Nurture** | Qualify inbound leads | Discovery questions, scheduling |
| **Customer Service** | Handle support | FAQ knowledge, escalation paths |
| **Review Generation** | Post-service follow-up | Satisfaction check, review request |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Home (internal ops hub)
│   ├── login/page.tsx
│   ├── auth/callback/            # Auth callback
│   ├── lab/
│   │   ├── page.tsx              # LAB home / demo list
│   │   ├── new/page.tsx          # New demo
│   │   ├── [id]/page.tsx         # Demo builder (resume draft)
│   │   └── success/page.tsx     # Magic Link Display
│   ├── recon/
│   │   ├── page.tsx              # RECON home
│   │   ├── research/             # Research list, [id], new
│   │   └── kb/                   # Knowledge base list, [id], new
│   ├── demo/[id]/page.tsx        # Magic Link Chat
│   └── api/
│       ├── scrape/route.ts
│       ├── demo/route.ts         # POST create demo
│       ├── demo/[id]/route.ts    # GET/PATCH/DELETE demo
│       ├── chat/route.ts         # POST chat (session-aware)
│       ├── research/route.ts     # POST run research, GET list
│       ├── recon/research/       # GET list, [id] GET/PATCH/DELETE
│       ├── knowledge-base/       # CRUD KBs, documents, upload
│       ├── sendgrid/inbound/     # Email channel
│       └── twilio/               # sms, voice, whatsapp
├── components/
│   ├── ui/                       # Design system
│   ├── lab/                      # Demo builder
│   ├── layout/                   # InternalAppShell, etc.
│   └── demo/                     # Chat experience
├── lib/
│   ├── openrouter.ts
│   ├── scraper.ts
│   ├── prompts.ts
│   ├── supabase.ts
│   ├── getDemoWithKb.ts          # Demo + linked KB from demo_knowledge_bases
│   └── database.types.ts
├── supabase/
│   └── migrations/
└── styles/
```

---

## What's implemented (current state)

- **Design system:** 23 UI components, Storybook, Tailwind.
- **THE LAB:** Demo builder (5-step wizard), autosave, LAB home, draft resume; Magic Link + QR; multi-channel (website, SMS, email, voice, WhatsApp).
- **RECON:** Research records (Perplexity, CRUD, status draft/reviewed/approved); knowledge bases (RECON-owned, status, documents, RAG); demos reference KBs via `demo_knowledge_bases`.
- **Auth/RBAC:** Home page, login, auth callback; role-based access (super_admin, operator); demos and RECON are role-scoped, not workspace-scoped.
- **Channels:** Mission×channel prompt strategies; SendGrid inbound, Twilio SMS/voice/WhatsApp webhooks; conversation engine (leads, sessions, messages).
- **Not yet:** RADAR UI, BLUEPRINT UI, role-scoped RLS (currently permissive).

---

## Decisions Made

| Question | Decision |
|----------|----------|
| **Demo Storage** | Supabase (PostgreSQL) |
| **Link Expiration** | 7 days default (configurable) |
| **Rate Limiting** | Configurable limits from start |

---

## Rate Limiting Strategy

| Limit Type | Default | Configurable |
|------------|---------|-------------|
| **Messages per demo session** | 50 | Yes |
| **Demos created per hour** | 10 | Yes |
| **API calls per minute (scraping)** | 5 | Yes |
| **OpenRouter tokens per demo** | 10,000 | Yes |

Limits stored in Supabase config table for easy adjustment without redeployment.
