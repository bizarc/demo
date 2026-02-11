# Architecture

## Overview

THE LAB is a Next.js application using the App Router pattern. All backend logic runs as serverless API routes. Data is stored in Supabase (PostgreSQL) and AI responses are streamed via OpenRouter.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    THE LAB (Internal)                        │
│                                                             │
│  Operator Flow:                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ URL Scraper  │→ │Demo Builder │→ │ Magic Link Generator│ │
│  │ /api/scrape  │  │ /lab/*      │  │ /lab/success        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  Data Layer:                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Supabase (PostgreSQL)                               │    │
│  │  demos │ leads │ sessions │ messages │ rate_limits   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                    Magic Link (expiring URL)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Demo Experience (External)                      │
│                                                             │
│  ┌──────────────────────────────────────────┐               │
│  │ Branded Chat Interface  /demo/[id]       │               │
│  │  → Lead identification (anonymous)       │               │
│  │  → Message history persistence           │               │
│  │  → Streaming AI responses                │               │
│  └──────────────────┬───────────────────────┘               │
│                     │                                       │
│  ┌──────────────────▼───────────────────────┐               │
│  │ Conversation Engine  /api/chat           │               │
│  │  → Session management                    │               │
│  │  → Token tracking & rate limiting        │               │
│  │  → OpenRouter API (SSE streaming)        │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Serverless-ready, Vercel deployment, RSC support |
| Styling | Tailwind CSS v4 | Design token system, rapid iteration |
| Backend | Next.js API Routes | Serverless, co-located with frontend |
| Database | Supabase (PostgreSQL) | Managed, RLS, real-time, free tier for demos |
| AI Provider | OpenRouter | Multi-model selection, unified API, cost control |
| Scraping | Cheerio + Jina AI | Cheerio for static sites, Jina fallback for JS-heavy |
| Streaming | Server-Sent Events | Native browser support, lower overhead than WebSockets |
| Testing | Vitest + Storybook | Unified toolchain, browser + jsdom environments |

## Data Flow

### Demo Creation (Operator)

```
1. POST /api/demo (status: 'draft')     → Creates draft in Supabase
2. PATCH /api/demo/[id]                  → Autosave on each field change
3. POST /api/scrape                      → Scrapes URL, returns context
4. PATCH /api/demo/[id] (status: 'active') → Generates system prompt, sets expiry
5. Redirect to /lab/success?id=...       → Shows Magic Link + QR code
```

### Chat Experience (Prospect)

```
1. GET /demo/[id]                        → Loads branded chat UI
2. Supabase query for demo config        → Company name, colors, system prompt
3. POST /api/chat                        → Sends message
   a. Find or create lead (anonymous)
   b. Find or create session
   c. Load conversation history from DB
   d. Stream response from OpenRouter
   e. Save user + assistant messages to DB
   f. Track token usage
4. GET /api/chat?demoId=...&leadId=...   → Loads history on refresh
```

### Draft Autosave

```
Step 1 complete → POST /api/demo (draft)  → URL updates to /lab/[id]
Field changes   → PATCH /api/demo/[id]    → Debounced (1s), immediate on step change
Step 5          → PATCH (status: 'active') → System prompt generated, demo goes live
```

## Key Patterns

### Server-Sent Events (Streaming)

The chat API uses SSE for real-time streaming. Each token is sent as:

```
data: {"token": "Hello"}
data: {"token": " world"}
data: [DONE]
```

### Lead Identification

Leads are identified per-demo using a `nanoid` stored in `localStorage`. Each unique visitor to a Magic Link gets their own conversation thread. The system does not use cookies or URL-based session IDs.

### Mission Profiles

System prompts are templated with company context:

```
{{companyName}} → "Acme Corp"
{{industry}}    → "Technology"
{{products}}    → "Widget Pro, Widget Lite"
{{offers}}      → "20% off annual plans"
```

## Funnel Finished Context

THE LAB is one module in the broader Funnel Finished platform:

| Module | Purpose | Status |
|--------|---------|--------|
| RADAR | Prospecting | Planned |
| **THE LAB** | **Sales demos** | **Active** |
| BLUEPRINT | Production config | Planned |
| MISSION CONTROL | Operations | Planned |
| CLIENT PORTAL | Client dashboard | Planned |
