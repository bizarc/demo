# Roadmap

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Design System & UI | Complete |
| Phase 1 | Core Implementation (THE LAB) | Complete |
| Phase 2 | Polish & Deploy | Complete |
| Phase 3 | Platform Intelligence & Channels | Complete |
| Phase 4 | Module Buildout (RECON → RADAR → BLUEPRINT) | In Progress |
| Phase 5 | Operations & Voice AI | Planned |

---

## Phase 0–2 — THE LAB Foundation (Complete)

Design system (23 UI components), full demo builder with 5-step wizard, branded chat experience, autosave, Storybook, Vitest/Playwright testing, Vercel deployment, error handling, and security hardening. See [archived roadmap](archive/roadmap_phase0-3.md) for full details.

---

## Phase 3 — Platform Intelligence & Channels (Complete)

| Item | Description | Status |
|------|-------------|--------|
| 3.1 Home & Auth | Home page, RBAC, optimistic locking, audit trails | ✅ Complete |
| 3.2 Research Skill | AI research via Perplexity, RECON integration | ✅ Complete |
| 3.3 Context Redesign | `agent_context` replaces fixed arrays, mission-aware templates | ✅ Complete |
| 3.4 Prompt Engineering | 20 mission×channel strategy blocks, layered prompt composition | ✅ Complete |
| 3.5 Knowledge Bases (RAG) | pgvector, ingestion, retrieval for LAB scope | ✅ Complete |

---

## Phase 4 — Module Buildout (Next)

> Build out the core Funnel Finished platform modules. Each module is a distinct workspace within the same Next.js application, sharing the design system, auth, and RECON intelligence layer.

### 4.0 Platform scope and RBAC (role vs workspace)

**Principle:** RECON, RADAR, THE LAB, and MISSION CONTROL are managed by **roles** (e.g. `super_admin`, `operator`), not by workspace. **Workspace separation is only for client implementations** (BLUEPRINT production configs, Client Portal tenant isolation).

**Tasks (implementable now):**
- [ ] **Research records: role-scoped, not workspace-scoped** — Migrate `research_records` off `workspace_id` (e.g. make nullable and use NULL for internal scope, or drop column). Internal RECON data must not depend on workspace. Update RLS so access is determined by `profiles.role` (e.g. super_admin: all; operator: read/write by created_by or shared internal scope).
- [ ] **Knowledge bases: enforce role-scoped RLS** — Ensure `knowledge_bases` RLS policies use role (and optionally `created_by`) only; no workspace_id in policy. KBs are already RECON-owned (no demo_id); tighten policies to match.
- [ ] **THE LAB demos: role-scoped only** — Confirm demos are filtered by role (super_admin sees all, operator sees own via `created_by`). Remove or avoid any demo–workspace coupling for internal LAB use. Workspace is not used for LAB.
- [ ] **API and UI: consistent scope checks** — All RECON/LAB APIs (research, knowledge-base, demo list) enforce role-based scope in middleware or RLS; do not filter by workspace for internal modules.
- [ ] **Document workspace boundary** — In architecture/database docs, state explicitly: `workspace_id` is used only for BLUEPRINT client deployments and Client Portal; internal ops tables (research_records, knowledge_bases, demos for LAB) do not use workspace for access control.
- [x] **demo_knowledge_bases link table** — Demos reference KBs only via `demo_knowledge_bases`; `demos.knowledge_base_id` has been removed (no backward compatibility).
- [x] **Research and KB lifecycle: reviewed/approved** — Status values are `draft`, `reviewed`, `approved`, `archived` in DB, API, and UI everywhere.

**Dependencies:** None. Aligns existing schema and RLS with the intended role-vs-workspace model.

---

### 4.1 RECON — Shared Intelligence Module

RECON is the platform-global system of record for shared intelligence. It is consumed by the LAB (already), RADAR, and BLUEPRINT. Full role-only scope (no workspace) is completed via **4.0** tasks above.

## Phase 4: Foundational Intelligence & Tooling (Q2)
#### 4.1 RECON Module Buildout 🏁
*Status: Complete*
- Decouples Knowledge Bases from individual demos.
- Establishes global `knowledge_bases` (RECON-owned); access should be enforced by role per **4.0**.
- Creates specialized `/recon` UI for managing:
  - Global Prompts & System Instructions
  - Shared Knowledge Bases (docs, embeddings)
  - Research Records 
- Enables "Select Existing KB" in Demo Builder.

**Dependencies:** None — can start immediately. Existing `/api/research` and KB routes are the foundation.

---

### 4.2 RADAR — Prospecting & Campaigns 🏁
*Status: Complete*

RADAR is the prospecting engine. It finds, enriches, and engages leads using RECON intelligence.

**What was built:**
- [x] **Discovery layer** — Google Places API search (`/radar/discover`); Perplexity AI fallback; `discovery_sessions` table stores search history
- [x] **Contact enrichment** — Website scraping + AI lookup to find email addresses; `enrichProspectEmail()` in `radarEnrich.ts`
- [x] **RADAR UI** — Pipeline dashboard at `/radar`; Discover page; Prospects pipeline with email found/missing indicators
- [x] **Prospect management** — Import from discovery, CSV import, manual add; `status: new` (no email) → `active` (has email); bulk enrich action
- [x] **Campaign builder** — Multi-step drip sequences with `outreach_goal` + `target_niche`; no mission profile dependency
- [x] **RECON integration** — Campaigns optionally reference RECON research records and KBs for personalization
- [x] **Analytics** — Open rates, reply rates, conversion tracking per campaign via `campaign_analytics` view
- [x] **Email sending** — SendGrid integration; cron-based send-due processing; open/click/unsubscribe tracking
- [x] **LAB handoff** — "Create Demo in LAB" button on prospect detail pre-fills company/website/industry
- [x] **SendGrid webhooks** — Inbound reply handling, bounce/unsubscribe processing

**Key files:** `src/lib/radar.ts`, `radarPlaces.ts`, `radarEnrich.ts`, `radarPrompts.ts`, `radarSendgrid.ts`, `radarCsv.ts`; migrations `20260302_001–007`; 24+ API routes under `/api/radar/`; 10+ UI pages under `/radar/`

**Dependencies:** RECON (4.1) should be at least partially complete so RADAR can reference shared intelligence assets.

---

### 4.3 BLUEPRINT — Production Configuration

BLUEPRINT converts approved LAB demos into production-ready agent deployments for clients.

**What needs to be built:**
- [ ] **BLUEPRINT UI** — Dashboard at `/blueprint` for managing production configurations
- [ ] **Demo → Blueprint promotion** — Workflow to copy an approved LAB demo into a production config (Push-to-BLUEPRINT action already exists in schema)
- [ ] **Workspace scoping** — Tenant isolation via `workspace_id` for client-specific deployments
- [ ] **Configuration management** — Production agent settings, branding, domain mapping
- [ ] **RECON consumption** — Production agents reference approved RECON assets (pinned versions)
- [ ] **Client provisioning** — Onboarding workflow to set up new client workspaces

**Dependencies:** RECON (4.1) for shared intelligence, LAB Push-to-BLUEPRINT action.

---

## Phase 5 — Operations & Voice AI (Planned)

### 5.1 MISSION CONTROL — Operations Dashboard
- Unified operational view across all modules
- Real-time metrics: active demos, live conversations, campaign performance
- Alert system for expiring demos, rate limit spikes, client issues
- Team management and assignment

### 5.2 CLIENT PORTAL — Client Dashboard
- Client-facing view of their deployed agents (BLUEPRINT configs)
- Analytics: conversation volumes, satisfaction scores, lead quality
- Self-service configuration (within guardrails)
- Workspace-scoped with tenant isolation

### 5.3 Voice AI Demos
- Voice AI demo architecture per mission
- Provider evaluation: ElevenLabs, OpenAI TTS/STT, Deepgram
- Browser-based and/or phone call UX
- Integration with existing conversation engine and Twilio voice webhook

---

## Platform Architecture

```
RADAR (Prospecting)
    ↓
THE LAB (Sales Demos)        ← Complete
    ↓
BLUEPRINT (Production Config)
    ↓
MISSION CONTROL (Operations)
    ↓
CLIENT PORTAL (Retention)

    ↕ All modules share ↕
    RECON (Intelligence)
```
