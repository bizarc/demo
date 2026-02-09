# THE LAB Demo MVP — Implementation Plan

## Goal
Build a working demo environment where operators can create branded, AI-powered chat demos for prospects. Prospects receive a "Magic Link" to experience a live conversation with an AI agent configured for their business.

---

## Project Phases

### Phase 0: Design System & UI (Current Priority)
Generate and iterate on designs in Stitch before any implementation.

### Phase 1: Core Implementation
Build the approved designs with full functionality.

### Phase 2: Polish & Deploy
Testing, refinement, and production deployment.

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
│               Demo Experience (External)                    │
│  ┌───────────────────┐  ┌─────────────────────────────────┐│
│  │ Branded Chat UI   │←→│ OpenRouter API (Streaming)      ││
│  └───────────────────┘  └─────────────────────────────────┘│
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
| **Storage** | TBD (in-memory vs. Vercel KV) | Decide before Phase 1 |

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
│   ├── lab/page.tsx              # Demo Builder
│   ├── demo/[id]/page.tsx        # Magic Link page
│   └── api/
│       ├── scrape/route.ts
│       ├── demo/route.ts
│       └── chat/route.ts
├── components/
│   ├── ui/                       # Design system
│   ├── lab/                      # Demo builder
│   └── demo/                     # Chat experience
├── lib/
│   ├── openrouter.ts
│   ├── scraper.ts
│   └── prompts.ts
└── styles/
```

---

## Open Questions

1. **Demo Storage**: In-memory (resets on deploy) or persistent (Vercel KV/Supabase)?
2. **Link Expiration**: 7 days default?
3. **Usage Limits**: Rate limiting from start?
