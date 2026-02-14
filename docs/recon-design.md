# RECON: Shared Intelligence Module Design

> **Status:** Design complete. Implementation staged in `task.md` 3.2, 3.5, 3.7.
> **Scope:** Research and knowledge assets shared by RADAR, THE LAB, and BLUEPRINT.
> **Internal vs. Workspace:** LAB/RECON research uses a single internal scope. Workspaces are reserved for BLUEPRINT client implementations only.

---

## 1. Overview

RECON is the system of record for client/workspace-scoped intelligence:

- **Research records:** AI-generated company intelligence (Perplexity, scrape, manual)
- **Knowledge bases:** Document collections with vector retrieval (product catalogs, FAQs, etc.)
- **Link tables:** Associate assets with demos, campaigns, and blueprints

Modules reference RECON assets; they do not fork copies unless explicitly snapshotted.

---

## 2. Data Model

### 2.1 Core Entities

```
workspaces (existing)
    │
    ├── research_records (workspace_id)
    │       └── research_links (record_id → demo_id | campaign_id | blueprint_id)
    │
    └── knowledge_bases (workspace_id)  [target: migrate from demo_id]
            ├── documents
            ├── chunks
            └── demo_knowledge_bases (demo_id, kb_id)  [link table]
```

### 2.2 Research Records

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
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

**Target:** `knowledge_bases.workspace_id` + link table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK → workspaces |
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

### Phase 1: Add Workspace Context
1. Ensure `workspaces` table exists (from auth migration)
2. Add `workspace_id` to `knowledge_bases` (nullable initially)
3. Backfill: `workspace_id = (SELECT workspace_id FROM profiles WHERE id = created_by)` or default workspace
4. Add `status` to knowledge_bases (default `draft`)

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
1. Make `knowledge_bases.workspace_id` NOT NULL
2. Drop `knowledge_bases.demo_id`
3. Make `demos.knowledge_base_id` resolve via `demo_knowledge_bases` (view or join)
4. Update RLS policies for workspace-scoped access

---

## 6. Acceptance Criteria (Implementation)

- [ ] Research records CRUD with workspace_id and status
- [ ] Research lifecycle transitions (draft → validated → production_approved)
- [ ] RADAR/LAB/BLUEPRINT read filters by status per contract
- [ ] Knowledge bases: workspace_id column added; migration script for existing rows
- [ ] demo_knowledge_bases link table; demos can reference workspace KBs
- [ ] RBAC: workspace-scoped access enforced via RLS

---

## 7. Related Docs

- `docs/research-skill-design.md` — Research API and Perplexity integration
- `docs/knowledge-base-design.md` — KB ingestion, retrieval, RAG flow
- `IMPLEMENTATION_PLAN.md` — Platform expansion direction
