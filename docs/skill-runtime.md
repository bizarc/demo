# RECON Skill Runtime

## Overview

The Skill Runtime is the execution and governance layer for reusable AI capabilities in RECON. Each capability (research type, KB quality check, outreach generation) is modeled as a **skill** with a stable key, input/output contract, and execution mode policy.

## Concepts

- **Skill catalog** — Registry of versioned skills (`skill_catalog` table). Each row defines `skill_key`, `skill_family`, execution modes, and optional schemas.
- **Skill run** — One execution of a skill (`skill_runs` table). Records input, output, lifecycle state, and approval provenance.
- **Execution modes** — `assist` (operator-led, AI assists), `hitl` (agent drafts, operator approves), `autonomous` (agent runs within policy). Autonomous is restricted to `super_admin` until quality gates are passed.

## Skill families

| Family | Purpose | Examples |
|--------|---------|----------|
| **research** | Company, industry, function, or technology intelligence | `research.company.profile.v1`, `research.industry.landscape.v1`, `research.function.v1`, `research.technology.v1` |
| **knowledge_base** | KB strategy, quality scorecard, ingestion best practices | `kb.quality.generic.v1`, `kb.quality.customer_service.v1` |
| **outreach** | Prospecting email, LinkedIn, and other channel copy | `outreach.prospecting.email.v1`, `outreach.linkedin.message.v1` |

## Research type taxonomy

- **company** — Single organization (demo prep, account planning).
- **industry** — Vertical/market (RADAR targeting, vertical playbooks).
- **function** — Business function or domain (e.g. Customer Service, Finance, Sales); practices, SOPs, escalation.
- **technology** — Platform or tool (e.g. ServiceNow, Workday); capabilities, troubleshooting, adoption.

## Flow

1. Operator or system calls `POST /api/recon/skills/execute` with `skillKey`, `executionMode`, and `input`.
2. Runtime loads skill from catalog, checks execution mode vs role, creates a `skill_run` (status `running`).
3. Dispatcher runs the skill (research → Perplexity + `research_records`; KB → scorecard; outreach → prompt + LLM).
4. Run is completed with `output_payload`, optional `output_asset_id`, and `lifecycle_state: draft`.
5. Operator can promote the run via `PATCH /api/recon/skill-runs/[id]` (reviewed/approved/archived).

## Governance

- **Policy** — Implemented in `isExecutionModeAllowed()` in `src/lib/skillCatalog.ts`. Autonomous only for `super_admin`.
- **Approval** — Skill runs default to `draft`. Use `PATCH /api/recon/skill-runs/[id]` to set `lifecycle_state` to `reviewed` or `approved` and record `approved_by` / `approved_at`.
- **Audit** — All runs are stored with `created_by`, `completed_at`, and optional `approved_by` / `rejection_reason`.

## Key files

- `src/lib/skillCatalog.ts` — List skills, get by key, execution mode policy, create/complete runs, list runs, update lifecycle.
- `src/lib/skillRuntime.ts` — `executeSkill()`, research/KB/outreach dispatchers.
- `src/app/api/recon/skills/route.ts` — List skills.
- `src/app/api/recon/skills/execute/route.ts` — Execute skill.
- `src/app/api/recon/skill-runs/route.ts` — List runs.
- `src/app/api/recon/skill-runs/[id]/route.ts` — Approve/reject run.
