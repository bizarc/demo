---
name: LAB Completion Next Steps
overview: LAB core authoring and delivery (builder, magic link, chat) is functionally complete. LAB complete scope centers on multi-channel demo support via Twilio (SMS, Messenger, Email, Website, Voice), Mission x Channels (channel-aware prompts), plus tenancy/RBAC alignment and validation. Channel priority: 1=SMS, 2=Messenger, 3=Email, 4=Website, 5=Voice.
todos:
  - id: validation
    content: Validation and closeout (lint, typecheck, test, build, E2E, docs)
  - id: missions-channels
    content: Mission x Channels (channel-aware prompts)
  - id: channel-sms
    content: SMS channel (Twilio)
  - id: channel-messenger
    content: Messenger channel (WhatsApp, Telegram via Twilio)
  - id: channel-email
    content: Email channel (Twilio SendGrid or similar)
  - id: channel-website
    content: Website chat (current; ensure channel selection)
  - id: channel-voice
    content: Voice channel (Twilio)
  - id: workspace-refactor
    content: Workspace and permission architecture refactor
  - id: rbac-levels
    content: RBAC permission levels (super user / general user)
isProject: false
---

# LAB Functionality Completion — Next Steps

## Current LAB State

**Implemented and working:**

- Demo Builder (6 steps: Mission, Website, Context, Knowledge Base, Model, Summary)
- Asset injection: URL scrape, RECON AI research (Step 3), Knowledge Base selection, logo/colors
- Draft autosave, optimistic locking, Push-to-BLUEPRINT
- LAB Home with demo list, filtering, status badges
- Magic Link + branded chat experience at `/demo/[id]`
- Auth for internal users; AUTH_DISABLED for dev/E2E

**Gaps** (from [task.md](task.md) and [Funnel Finished Specification v3.md](Funnel%20Finished%20Specification%20v3.md)):


| Gap                               | Priority | Effort   |
| --------------------------------- | -------- | -------- |
| Mission x Channels (prompts)      | Required | Medium   |
| SMS (Twilio)                       | 1        | Medium   |
| Messenger (WhatsApp, Telegram)     | 2        | Medium   |
| Email                              | 3        | Medium   |
| Website (current chat)             | 4        | Low      |
| Voice (Twilio)                     | 5        | Medium   |
| Workspace/permission refactor      | —        | Medium   |
| RBAC permission levels             | —        | Low-Med  |
| Validation/E2E                     | —        | Low      |

**Provider:** Internal Twilio phone number; supports all channel use cases.


---

## Recommended Next Steps (in order)

### 1. Validation and closeout (low effort)

**Goal:** Ensure LAB is shippable and documented.

- Run `npm run lint`, `typecheck`, `test`, `build` — confirm all pass
- Fix E2E if needed (port config, AUTH_DISABLED, mock routes)
- Update [docs/architecture.md](docs/architecture.md) and [docs/roadmap.md](docs/roadmap.md) with RECON research integration
- Mark validation checklist items in task.md

**Deliverables:** Green CI, docs reflect current LAB state.

---

### 2. Mission x Channels (channel-aware prompts) — required

**Goal:** Channel-aware prompts so demos behave correctly per channel (tone, length, CTA, compliance).

**Tasks:**
- Define mission × channel matrix: 4 missions (Reactivation, Nurture, Service, Review) × 5 channels (SMS, Messenger, Email, Website, Voice)
- Extend [src/lib/prompts.ts](src/lib/prompts.ts) with channel-specific variants (e.g., shorter for SMS, compliant CTAs for each)
- Add channel selection to builder (Step 1 or new sub-step)
- Persist `channel` in demo config; sessions already have `channel: 'chat' | 'voice' | 'sms'` — extend for messenger, email
- Test prompt quality across mission/channel combinations

---

### 3. Multi-channel support (Twilio) — priority order

**Provider:** Internal Twilio phone number; supports all use cases (SMS, Voice, WhatsApp, etc.).

**Channel priority (implement in order):**

| # | Channel     | Twilio component              | Notes                          |
|---|-------------|-------------------------------|--------------------------------|
| 1 | SMS         | Twilio SMS API               | Core outreach channel          |
| 2 | Messenger   | Twilio WhatsApp, Telegram    | WhatsApp Business API; Telegram via adapter if needed |
| 3 | Email       | SendGrid or Twilio SendGrid   | Async; different delivery model |
| 4 | Website     | Current magic-link chat       | Already implemented; add channel selection in builder |
| 5 | Voice       | Twilio Voice, TTS/STT         | Call Me Now; outbound or inbound |

**Tasks:**
- Integrate Twilio SDK; configure with internal account/number
- Implement channel-specific demo experiences (SMS thread, WhatsApp conversation, email thread, website chat, voice call)
- Add channel selector to builder; store selected channel in demo config
- Webhooks/inbound: Twilio webhook routes for SMS, Voice, WhatsApp incoming messages
- Reuse conversation engine (leads, sessions, messages); extend for each channel
- Each channel: entry point (phone number, magic link, etc.), session routing, prompt assembly from Mission x Channel matrix

---

### 4. Workspace and permission architecture refactor (medium effort)

**Goal:** Align schema and access model: internal ops use permission levels; workspaces only for client implementations.

**Architecture principle:**
- **Internal** (research, demos, operations): Permission-level security (super user / general user). No workspaces.
- **Workspaces**: Only for BLUEPRINT client implementations and client-segmented portals. Multi-tenancy lives here.

**Tasks:**
- Remove `workspace_id` from `research_records` (or replace with global/internal scope). Research is internal and may be performed without prospect context.
- Remove or stop using `profiles.workspace_id` for internal operators. Keep `profiles.role` (super_admin, operator, client_viewer) for permission levels.
- Ensure demos remain `created_by`-scoped only; no workspace filter for LAB.
- Reserve `workspaces` table for future BLUEPRINT (client configs) and CLIENT PORTAL (client dashboards). Document that workspaces = client implementations.
- Update docs/recon-design.md, docs/research-skill-design.md, IMPLEMENTATION_PLAN.md, and docs/architecture.md to reflect this split.
- Update src/app/api/research/route.ts to stop using workspace_id (remove profile lookup, use single internal scope).

**Note:** Operations security uses super user / general user permission levels, not workspaces. Workspaces are for client-facing multi-tenancy only.

---

### 5. RBAC permission levels (internal ops, low-medium effort)

**Goal:** Enforce super user vs general user for internal ops (LAB, RADAR, MISSION CONTROL).

- Keep `profiles.role` (super_admin, operator) — super_admin sees all; operator sees own created content or team-scoped data as defined.
- No workspace scoping for internal modules. Document permission semantics.
- Apply consistently to LAB, future RADAR, and MISSION CONTROL.

---

## Summary: LAB complete scope

| Scope                    | Includes                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| **LAB complete**         | Validation (1) + Mission x Channels (2) + Multi-channel Twilio (3: SMS→Messenger→Email→Website→Voice) + Workspace refactor (4) + RBAC (5) |
| **Provider**             | Twilio (internal phone number) for all channels                          |

---

## Questions before implementation

1. **Twilio setup:** Are Twilio credentials (Account SID, Auth Token, phone number) available for dev/staging?
2. **WhatsApp/Telegram:** Is Twilio WhatsApp Business API already approved, or start with SMS-only for MVP?
3. **Email:** Use Twilio SendGrid or a different provider for the email channel?

