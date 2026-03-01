# Roadmap

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Design System & UI | Complete |
| Phase 1 | Core Implementation (THE LAB) | Complete |
| Phase 2 | Polish & Deploy | Complete |
| Phase 3 | Platform Intelligence & Channels | Complete |
| Phase 4 | Module Buildout (RECON → RADAR → BLUEPRINT) | Next |
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

### 4.1 RECON — Shared Intelligence Module

RECON is the platform-global system of record for shared intelligence. It is consumed by the LAB (already), RADAR, and BLUEPRINT.

## Phase 4: Foundational Intelligence & Tooling (Q2)
#### 4.1 RECON Module Buildout 🏁
*Status: Complete*
- Decouples Knowledge Bases from individual demos.
- Establishes global `knowledge_bases` managed by `role` instead of `workspace_id`.
- Creates specialized `/recon` UI for managing:
  - Global Prompts & System Instructions
  - Shared Knowledge Bases (docs, embeddings)
  - Research Records 
- Enables "Select Existing KB" in Demo Builder.

**Dependencies:** None — can start immediately. Existing `/api/research` and KB routes are the foundation.

---

### 4.2 RADAR — Prospecting & Campaigns

RADAR is the prospecting engine. It finds, enriches, and engages leads using RECON intelligence.

**What needs to be built:**
- [ ] **RADAR UI** — Dashboard at `/radar` for managing prospect lists and campaigns
- [ ] **Prospect management** — Import, enrich, segment, and score leads
- [ ] **Campaign builder** — Multi-step outreach sequences (email, SMS) using mission-aware prompts
- [ ] **RECON integration** — Campaigns reference RECON research and KBs for personalized outreach
- [ ] **Analytics** — Open rates, reply rates, conversion tracking per campaign
- [ ] **Twilio/SendGrid integration** — Production SMS/email delivery (webhook endpoints already exist)

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
