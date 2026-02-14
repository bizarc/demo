# RECON: Shared Intelligence Module Design

> **Status:** Design complete. Implementation staged in `task.md` 3.2, 3.5, 3.7.
> **Scope:** Platform-global internal research and knowledge assets shared by RADAR, THE LAB, and BLUEPRINT.
> **Internal vs. Workspace:** RECON is outside workspaces. Workspaces are reserved for BLUEPRINT client deployments and Client Portal multi-tenancy.

---

## 1. Overview

RECON is the system of record for platform-global internal intelligence:

- **Research records:** AI-generated company intelligence (Perplexity, scrape, manual)
- **Knowledge bases:** Document collections with vector retrieval (product catalogs, FAQs, etc.)
- **Link tables:** Associate assets with demos, campaigns, and blueprints

Modules reference RECON assets; they do not fork copies unless explicitly snapshotted.

---

## 2. Data Model

### 2.1 Core Entities

```
recon_internal_scope (single logical scope)
    │
    ├── research_records
    │       └── research_links (record_id → demo_id | campaign_id | blueprint_id)
    │
    └── knowledge_bases  [target: migrate from demo_id]
            ├── documents
            ├── chunks
            └── demo_knowledge_bases (demo_id, kb_id)  [link table]
```

### 2.2 Research Records

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| target_id | UUID? | Prospect/account/company profile |
| source | enum | `perplexity` \| `scrape` \| `manual` \| `import` |
| title | text | Brief identifier |
| summary | text | Company overview |
| competitors | text[] | Competitor list |
| market_position | text? | Market notes |
| offerings | text[] | Products/services |
| tech_stack | text[] | Tech stack observations |
| evidence | jsonb | [{ label, url?, snippet? }] |
| confidence_score | float? | 0-1 |
| status | enum | See lifecycle below |
| created_by | UUID | FK → auth.users |
| created_at, updated_at | timestamptz | |

### 2.3 Research Links

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| research_id | UUID | FK → research_records |
| link_type | enum | `demo` \| `campaign` \| `blueprint` |
| target_id | UUID | demo_id, campaign_id, or blueprint_id |
| created_at | timestamptz | |

### 2.4 Knowledge Bases (Target Schema)

**Current:** `knowledge_bases.demo_id` (demo-owned)

**Target:** `knowledge_bases` as RECON-owned (internal) + link table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| name | text | |
| type | enum | product_catalog \| faq \| service_menu \| review_template \| custom |
| status | enum | draft \| validated \| production_approved |
| created_by | UUID | FK → auth.users |
| created_at, updated_at | timestamptz | |

### 2.5 Demo-Knowledge Base Link

| Column | Type | Description |
|--------|------|-------------|
| demo_id | UUID | FK → demos |
| kb_id | UUID | FK → knowledge_bases |
| created_at | timestamptz | |

Primary key: (demo_id, kb_id). A demo can reference one KB for MVP; link table allows future many-to-many.

---

## 3. Asset Lifecycle

```
draft ──► validated ──► production_approved
   │            │                │
   └────────────┴────────────────┴──► archived
```

| State | Description | RADAR | LAB | BLUEPRINT |
|-------|-------------|-------|-----|-----------|
| draft | Initial output | read/write | read/write | — |
| validated | Operator reviewed | read | read | read* |
| production_approved | Approved for prod | read | read | read |

*BLUEPRINT can reference `validated` with explicit operator confirmation.

---

## 4. Module Contracts

### RADAR (Prospecting)
- **Read:** `validated`, `production_approved` research for campaign context
- **Write:** Draft research from campaign discovery/signals

### THE LAB (Demos)
- **Read:** Research + knowledge bases to prefill demo context
- **Write:** Draft research/KB updates when discovered during demo prep
- **Link:** Associate demos with research/KB via link tables

### BLUEPRINT (Production)
- **Read:** Only `production_approved` by default; `validated` with operator confirmation
- **Write:** None (consumes only)
- **Link:** Select approved KBs for deployment config

---

## 5. Migration Path (Demo-Scoped → RECON-Scoped)

### Phase 1: Add RECON Internal Ownership
1. Keep RECON assets in single internal scope (no workspace key)
2. Add `status` to `knowledge_bases` (default `draft`)
3. Ensure `created_by` is populated for role-scoped authorization and auditing

### Phase 2: Create Link Table
1. Create `demo_knowledge_bases` (demo_id, kb_id)
2. Migrate: For each demo with `knowledge_base_id`, insert into `demo_knowledge_bases`
3. Keep `demos.knowledge_base_id` for backward compatibility during transition
4. Update API to read from link table when present

### Phase 3: Research Tables
1. Create `research_records` table
2. Create `research_links` table
3. Implement research API routes

### Phase 4: Cutover
1. Drop `knowledge_bases.demo_id`
2. Make `demos.knowledge_base_id` resolve via `demo_knowledge_bases` (view or join)
3. Update RLS policies for role-scoped internal access (`super_admin` all, `operator` policy-based scope)
4. Keep workspace-based RLS for BLUEPRINT/client portal data only

---

## 6. Acceptance Criteria (Implementation)

- [ ] Research records CRUD with status and role-scoped access
- [ ] Research lifecycle transitions (draft → validated → production_approved)
- [ ] RADAR/LAB/BLUEPRINT read filters by status per contract
- [ ] Knowledge bases migrated from `demo_id` ownership to RECON ownership
- [ ] demo_knowledge_bases link table; demos can reference RECON KBs
- [ ] RBAC: role-scoped internal access enforced via RLS

---

## 7. Related Docs

- `docs/research-skill-design.md` — Research API and Perplexity integration
- `docs/knowledge-base-design.md` — KB ingestion, retrieval, RAG flow
- `IMPLEMENTATION_PLAN.md` — Platform expansion direction
