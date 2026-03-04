# RECON Research Skill Design

> **Status:** Design complete. Implementation done for LAB scope; RADAR/BLUEPRINT hooks when those modules exist.
> **Scope:** Platform-global internal research in RECON, shared by RADAR, THE LAB, and BLUEPRINT.
> **Lifecycle:** Implemented as `draft` → `reviewed` → `approved` → `archived` in DB, API, and UI.

---

## 1. Purpose

The Research Skill generates structured company intelligence that can be reused across the platform:

- **RADAR:** campaign personalization and targeting context
- **THE LAB:** richer demo setup context
- **BLUEPRINT:** production workflow and prompt tuning inputs

Research is not module-owned. It is a RECON asset in a single internal scope. Workspace scoping applies only to BLUEPRINT client deployments and Client Portal views.

---

## 2. Ownership and Boundaries

- **System of record:** RECON
- **Scope boundary:** Global internal (outside workspaces)
- **Authoring:** Internal operators and automated jobs
- **Consumption:** RADAR, THE LAB, BLUEPRINT
- **Client Portal:** Read-only derived views only (not raw internal notes by default)

Guiding rule: modules reference research assets; they do not fork copies unless explicitly snapshotted for audit.

---

## 3. Data Model (Proposed)

```typescript
type ResearchStatus = 'draft' | 'reviewed' | 'approved' | 'archived';

interface ResearchRecord {
  id: string;
  target_id?: string; // prospect, account, or company profile id
  source: 'perplexity' | 'scrape' | 'manual' | 'import';
  title: string;
  summary: string;
  competitors: string[];
  market_position?: string;
  offerings: string[];
  tech_stack: string[];
  evidence: Array<{ label: string; url?: string; snippet?: string }>;
  confidence_score?: number; // 0-1
  status: ResearchStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

Optional companion entities for traceability:

- `research_runs` (prompt/model/runtime metadata)
- `research_links` (maps records to campaigns, demos, blueprints)

### 3.1 Research Type Taxonomy

Research is classified by **research_type** (and corresponding skill_key) into four types:

| Type | Description | Examples | Primary use |
|------|-------------|----------|-------------|
| **company** | Single organization: offerings, positioning, competitors | Acme Corp, “Roofers Inc” | Demo prep, account planning, onboarding |
| **industry** | Vertical or market: trends, buyers, compliance | Roofing, SaaS, Healthcare | RADAR targeting, vertical playbooks |
| **function** | Business function or domain: practices, SOPs, escalation | Customer Service, Finance, Sales, HR | Agent behavior, escalation, best practices |
| **technology** | Platform or tool: troubleshooting, integration, adoption | ServiceNow, Workday, Salesforce | Technical playbooks, tool-specific guidance |

- **Function** = “how this role/domain works” (process, language, escalation). Stays relevant across tools.
- **Technology** = “how this product works” (features, troubleshooting, APIs). Tool-specific, often versioned.

Skill keys: `research.company.profile.v1`, `research.industry.landscape.v1`, `research.function.v1`, `research.technology.v1`.

---

## 4. Lifecycle

```mermaid
flowchart LR
  draft[Draft]
  reviewed[Reviewed]
  approved[Approved]
  archived[Archived]

  draft --> reviewed
  reviewed --> approved
  draft --> archived
  reviewed --> archived
  approved --> archived
```

- **Draft:** initial AI/manual output
- **Reviewed:** reviewed by operator, safe for internal use
- **Approved:** allowed for BLUEPRINT production use
- **Archived:** retained for history, excluded from defaults

---

## 5. Module Contracts

### RADAR
- Reads `reviewed` and `approved` records for messaging context.
- Writes draft research from campaign discovery/signal workflows.

### THE LAB
- Reads existing research to prefill context during demo build.
- Writes draft updates when new business context is discovered during demo prep.

### BLUEPRINT
- Reads only `approved` records by default.
- Can reference `reviewed` records with explicit operator confirmation.

---

## 6. Merge Contract with Scraping and KB

Research should merge with scrape outputs and KB retrieval without overwriting provenance:

```typescript
interface ReconContextEnvelope {
  scrape: {
    companyName?: string;
    industry?: string;
    products?: string[];
    offers?: string[];
    qualifications?: string[];
  };
  research: ResearchRecord[];
  knowledgeBase: {
    kb_ids: string[];
    retrieved_chunks?: string[];
  };
}
```

Prompt assembly order:
1. Core business fields
2. Scrape context
3. Research highlights
4. KB retrieval blocks

---

## 7. Governance and RBAC Notes

- All RECON research records are internal-scope (no workspace key required).
- Internal roles are role-scoped (`super_admin`, `operator`) for read/write behavior.
- Client Viewer access is restricted to curated summaries in CLIENT PORTAL.
- Promotion to `approved` requires operator action and auditability.

---

## 8. Implementation Sequencing (Future)

1. Define DB schema for internal-scope research records and links.
2. Build `POST /api/research` and `GET /api/research` with status filters.
3. Integrate RADAR campaign read/write hooks.
4. Integrate THE LAB prefill and enrichment actions.
5. Gate BLUEPRINT on `approved` data for production deploys.
