# Task 3.5: Knowledge Bases (RAG)

> **Status:** Implemented. See `supabase/migrations/20260213_knowledge_bases.sql`, `src/lib/embeddings.ts`, `src/lib/knowledgeBase.ts`, `src/lib/retrieval.ts`, `src/app/api/knowledge-base/`, `src/app/lab/steps/KnowledgeBaseStep.tsx`.

**Run the migration:** Execute `supabase/migrations/20260213_knowledge_bases.sql` in the Supabase SQL Editor to enable pgvector and create the tables.
> **Related:** Task 3.2 (Research Skill), Task 3.3 (Improved Scraping), `docs/architecture.md`, `src/lib/prompts.ts`

---

## 1. Current State

The existing system uses:

- **Supabase** (PostgreSQL) for demos, leads, sessions, messages
- **OpenRouter** for chat streaming and model selection
- **System prompts** built from `buildSystemPrompt()` with template vars: `{{companyName}}`, `{{industry}}`, `{{products}}`, `{{offers}}`, `{{qualificationCriteria}}`
- **Builder flow:** 5 steps (Mission, Website, Context, Model, Summary)

**Gap:** No structured knowledge retrieval. Context comes only from scraped website content and manually entered products/offers/qualifications. Missions like Customer Service (FAQ) and Review Generation (templates) would benefit from document-based knowledge bases.

### 1.1 RECON Alignment (Workspace Scope)

Funnel Finished now treats knowledge assets as part of **RECON**, a shared workspace-scoped intelligence module.

- **Authoritative owner:** RECON (workspace-scoped), not a single LAB demo.
- **LAB role:** consume and enrich RECON assets while configuring demos.
- **BLUEPRINT role:** consume production-approved RECON assets for deployment.
- **RADAR role:** optional consumer for campaign context and prospect personalization.

Implementation can remain demo-scoped as an interim shape, but target architecture is workspace-scoped reuse with explicit module contracts.

---

## 2. Use Cases by Mission Profile

| Mission | Primary Knowledge Types | Example Content |
|---------|-------------------------|-----------------|
| **Database Reactivation** | Product catalogs, new offerings, past customer segments | Product specs, pricing tiers, "what's new since you left" |
| **Inbound Nurture** | Product catalogs, qualification criteria, FAQ | Product comparison, use-case guides, FAQ answers |
| **Customer Service** | FAQ databases, service menus, escalation paths | Support articles, troubleshooting steps, contact/escalation rules |
| **Review Generation** | Review templates, satisfaction criteria | Review request wording, feedback prompts, incentive rules |

**Common patterns:** Product catalogs and FAQs span multiple missions. Service menus and review templates are mission-specific.

---

## 3. Vector DB Evaluation

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Supabase pgvector** | Already in stack; no new services; RLS; ~75% cheaper than Pinecone; HNSW indexing; single DB for demos + vectors | Must enable extension; compute scaling for large vector workloads | **Recommended** |
| **Pinecone** | Managed, scalable, purpose-built | Separate service; cost; adds complexity; different auth/ops | Consider only for BLUEPRINT at scale |
| **Vercel Postgres + pgvector** | Vercel-native | Would replace Supabase; migration cost | Not recommended (Supabase established) |
| **Chroma / Qdrant** | Self-hosted, open source | Ops burden; not serverless-friendly | Not aligned with current stack |

**Conclusion:** Use **Supabase pgvector**. Aligns with existing Supabase usage, shared RLS/auth, and documented RAG patterns. Pinecone reserved for future BLUEPRINT scale if needed.

---

## 4. Architecture

### 4.1 Data Model

```
workspaces (1) ──── (*) knowledge_bases
knowledge_bases (*) ──── (*) demos
knowledge_bases (*) ──── (*) blueprint_configs
knowledge_bases (1) ──── (*) documents
documents (1) ──── (*) chunks
chunks ──── knowledge_bases (belongs_to)
```

**Tables:**

- **knowledge_bases**: Workspace-scoped and reusable across demos/campaigns/blueprints.
  - `id`, `workspace_id`, `name`, `type`, `created_at`
  - `type`: `product_catalog` | `faq` | `service_menu` | `review_template` | `custom`

For transition compatibility, demo-level linking can remain, but should evolve to association tables (e.g. `demo_knowledge_bases`, `blueprint_knowledge_bases`) rather than hard ownership by `demo_id`.

- **documents**: Uploaded files with extracted content.
  - `id`, `kb_id`, `filename`, `content`, `chunk_count`, `created_at`

- **chunks**: Text segments with embeddings.
  - `id`, `kb_id`, `document_id`, `content`, `embedding` (vector(1536)), `chunk_index`, `created_at`
  - HNSW index on `embedding` for similarity search

**RPC:** Postgres function `match_chunks(kb_id, query_embedding, match_threshold, match_count)` for similarity search (PostgREST cannot use pgvector operators directly).

### 4.2 RAG Flow

```
1. User sends message to chat
2. Chat API loads demo (with knowledge_base_id if set)
3. If KB attached: Retrieval pipeline runs
   a. Embed user message via OpenRouter /embeddings
   b. Call match_chunks(kb_id, query_embedding)
   c. Get top-k chunks
4. Inject retrieved context into system prompt as {{knowledgeBaseContext}}
5. Stream response from OpenRouter chat
```

### 4.3 Prompt Injection

Extend `src/lib/prompts.ts` with a new template variable:

- `{{knowledgeBaseContext}}` — Injected after company context when a KB is attached.

Format:

```
--- Knowledge Base ---
[Retrieved chunk 1]
[Retrieved chunk 2]
...
```

If no KB or no retrieval hits: `{{knowledgeBaseContext}}` resolves to empty string. Mission templates already accommodate optional blocks.

---

## 5. Operator Upload / Ingestion Flow

### 5.1 Supported Formats (LAB Demo Scope)

| Format | Parsing | Notes |
|--------|---------|-------|
| **Plain text (.txt)** | Direct | Simple, operator-friendly |
| **Markdown (.md)** | Direct | Preserves structure |
| **CSV (.csv)** | Parse rows as chunks | Product lists, FAQ tables |
| **PDF (.pdf)** | External lib (e.g. pdf-parse) | Common for catalogs; consider size limits |

**Out of scope for demo:** Word, Excel, images. BLUEPRINT can expand.

### 5.2 Chunking Strategy

- **Chunk size:** 512–1024 tokens (balance retrieval precision vs. context)
- **Overlap:** 50–100 tokens to preserve continuity
- **Strategy:** Paragraph/section-aware where possible; fallback to fixed token windows
- **Metadata:** Store `document_id`, `chunk_index`, `source_filename` for citations and debugging

### 5.3 Ingestion Pipeline

1. **Upload** — `POST /api/knowledge-base/[id]/upload` (multipart/form-data)
2. **Parse** — Extract text by format (txt/md: direct; csv: row-based; pdf: pdf-parse)
3. **Chunk** — Split into overlapping chunks
4. **Embed** — OpenRouter Embeddings API (batch; e.g. `openai/text-embedding-3-small`)
5. **Store** — Insert chunks + embeddings into `chunks` table with HNSW index

**Async consideration:** Large uploads may exceed serverless timeout. Options: (a) sync for demo (small docs only), (b) background job (Supabase Edge Function / Vercel background), or (c) client-side chunking + batched embed/store. Recommend sync for MVP with strict size limits.

### 5.4 Size Limits (LAB Demo)

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max file size | 2 MB | Serverless payload + processing |
| Max files per KB | 10 | Demo scope |
| Max chunks per KB | 500 | Embedding cost + latency |
| Supported formats | txt, md, csv, pdf | Most common operator use cases |

---

## 6. Builder Integration

### 6.1 Placement

**Recommendation:** New step — "Knowledge Base" between Context and Model. Makes KB first-class and allows optional skip.

Step order: Mission → Website → Context → **Knowledge Base** → Model → Summary

### 6.2 UI Elements

- **KB selector:** Create new / select existing (if shared KBs later)
- **Upload area:** Drag-and-drop or file picker
- **Document list:** Filename, chunk count, remove
- **Preview:** Optional "test retrieval" with sample query
- **Skip:** "No knowledge base" option (current behavior)

### 6.3 Data Model Change

Add to `demos` table:

- `knowledge_base_id` (UUID, nullable, FK → knowledge_bases)

When `knowledge_base_id` is set, chat API runs retrieval before each response.

### 6.4 Module Contracts (RECON)

- **RADAR**: reads RECON for messaging context; may write research-derived KB drafts.
- **THE LAB**: reads RECON by default; may create/update KB content during demo prep.
- **BLUEPRINT**: selects production-approved RECON KBs; does not depend on demo-scoped ownership.

---

## 7. Embedding Model Selection

| Model | Dimensions | Cost | Notes |
|-------|-------------|------|-------|
| **openai/text-embedding-3-small** | 1536 | Low | OpenRouter-supported, good quality |
| **openai/text-embedding-ada-002** | 1536 | Legacy | Being deprecated |
| **Supabase/gte-small** | 384 | Free (self-hosted) | Requires separate inference; not via OpenRouter |

**Recommendation:** Use **openai/text-embedding-3-small** via OpenRouter — same API key, good cost/quality, 1536 dims. Define vector column as `vector(1536)`.

---

## 8. Demo vs. BLUEPRINT Scope Evaluation

| Aspect | LAB Demo | BLUEPRINT Production |
|--------|----------|----------------------|
| **Document count** | 1–10 per demo | Hundreds to thousands per client |
| **File size** | 2 MB limit | Larger; async processing |
| **Formats** | txt, md, csv, pdf | + Word, Excel, images, APIs |
| **Chunking** | Fixed + overlap | Advanced (semantic, table-aware) |
| **Vector DB** | Supabase pgvector | pgvector or Pinecone at scale |
| **Embedding** | OpenRouter | Same or dedicated embedding service |
| **Reusability** | Per-demo KB | Shared KBs, versioning |
| **Refresh** | Manual re-upload | Scheduled sync, webhooks |
| **Multi-tenancy** | Single creator | Client isolation, RBAC |

**Conclusion:** Design for LAB demo first with clear extension points (async ingestion, shared KBs, format expandability). BLUEPRINT can layer on scale and governance.

---

## 9. Implementation Phases

### Phase A: Foundation

- Enable pgvector in Supabase
- Create `knowledge_bases`, `documents`, `chunks` tables + RPC `match_chunks`
- Add `knowledge_base_id` to `demos`
- Create OpenRouter embeddings client in `src/lib/`

### Phase B: Ingestion

- Implement text/csv/md parsers; add pdf-parse for PDF
- Chunking utility with configurable size/overlap
- `POST /api/knowledge-base` (create)
- `POST /api/knowledge-base/[id]/upload` (ingest)
- `GET /api/knowledge-base/[id]` (list documents)

### Phase C: Retrieval

- `retrieve(kbId, query)` → embed query, call `match_chunks`, format context
- Integrate into `POST /api/chat`: if `demo.knowledge_base_id`, run retrieval and inject `{{knowledgeBaseContext}}`
- Extend `buildSystemPrompt` with optional KB context

### Phase D: Builder

- Add KnowledgeBaseStep (new step 4)
- Wire form state, autosave, demo API
- Document upload UI

### Phase E: Polish

- Rate limit KB operations
- Test retrieval quality across missions
- Update `docs/api-reference.md` with KB endpoints

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|------|-------------|
| Serverless timeout on large uploads | Size limits; async ingestion in Phase E or BLUEPRINT |
| Embedding cost at scale | Batch requests; cache; consider gte-small for high volume |
| Poor retrieval quality | Tune chunk size, overlap, match_threshold; add retrieval evaluation |
| PDF parsing quality | Use robust library; fallback to "extract best effort" + operator review |
