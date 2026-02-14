# Database Schema

THE LAB uses **Supabase** (managed PostgreSQL) with Row Level Security (RLS) enabled on all tables.

## Tables

### `demos`

Stores demo configurations, drafts, and active demos.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `created_at` | TIMESTAMPTZ | `NOW()` | No | Creation timestamp |
| `expires_at` | TIMESTAMPTZ | — | Yes | Expiration (null for drafts) |
| `company_name` | TEXT | — | Yes | Target company name |
| `industry` | TEXT | — | Yes | Detected/entered industry |
| `website_url` | TEXT | — | Yes | Scraped website URL |
| `products_services` | TEXT[] | `'{}'` | No | Products/services list |
| `offers` | TEXT[] | `'{}'` | No | Current offers list |
| `qualification_criteria` | TEXT[] | `'{}'` | No | Lead qualification criteria |
| `logo_url` | TEXT | — | Yes | Company logo URL |
| `primary_color` | TEXT | `'#2563EB'` | No | Brand primary color |
| `secondary_color` | TEXT | `'#F8F9FA'` | No | Brand secondary color |
| `mission_profile` | TEXT | — | Yes | One of: `reactivation`, `nurture`, `service`, `review` |
| `openrouter_model` | TEXT | — | Yes | AI model identifier |
| `system_prompt` | TEXT | — | Yes | Generated system prompt |
| `status` | TEXT | `'draft'` | No | One of: `draft`, `active`, `expired`, `blueprint` |
| `created_by` | TEXT | — | Yes | Creator identifier (pre-auth) |
| `updated_at` | TIMESTAMPTZ | `NOW()` | No | Auto-updated via trigger |
| `deleted_at` | TIMESTAMPTZ | — | Yes | Soft delete timestamp |
| `current_step` | TEXT | `'mission'` | Yes | Builder step for draft resume |
| `knowledge_base_id` | UUID | — | Yes | FK → knowledge_bases (RAG) |

**Indexes:** `status`, `created_by`, `deleted_at`

**Trigger:** `demos_updated_at` — auto-sets `updated_at` on every update.

---

### `leads`

Tracks unique visitors (prospects) per demo.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `demo_id` | UUID | — | No | FK → demos |
| `identifier` | TEXT | — | No | Unique lead identifier (nanoid) |
| `identifier_type` | TEXT | — | Yes | `email`, `phone`, or `anonymous` |
| `display_name` | TEXT | — | Yes | Optional display name |
| `created_at` | TIMESTAMPTZ | `NOW()` | No | First visit |
| `last_seen_at` | TIMESTAMPTZ | `NOW()` | No | Last activity |
| `metadata` | JSONB | `'{}'` | No | Additional data |

**Unique constraint:** `(demo_id, identifier)`

**Indexes:** `demo_id`, `(demo_id, identifier)`

---

### `sessions`

Groups messages into conversation threads per lead.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `lead_id` | UUID | — | No | FK → leads |
| `demo_id` | UUID | — | No | FK → demos |
| `channel` | TEXT | `'chat'` | No | `chat`, `voice`, or `sms` |
| `created_at` | TIMESTAMPTZ | `NOW()` | No | Session start |
| `ended_at` | TIMESTAMPTZ | — | Yes | Session end (null if active) |
| `metadata` | JSONB | `'{}'` | No | Additional data |

**Indexes:** `lead_id`, `demo_id`

---

### `messages`

Individual messages within a session.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `session_id` | UUID | — | No | FK → sessions |
| `role` | TEXT | — | No | `system`, `user`, or `assistant` |
| `content` | TEXT | — | No | Message text |
| `created_at` | TIMESTAMPTZ | `NOW()` | No | Timestamp |
| `token_count` | INTEGER | `0` | No | Tokens used by this message |
| `metadata` | JSONB | `'{}'` | No | Additional data |

**Indexes:** `session_id`, `(session_id, created_at)`

---

### `knowledge_bases`

Stores RAG knowledge bases per demo.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `demo_id` | UUID | — | No | FK → demos |
| `name` | TEXT | `'Default'` | No | Display name |
| `type` | TEXT | `'custom'` | No | `product_catalog`, `faq`, `service_menu`, `review_template`, `custom` |
| `created_at` | TIMESTAMPTZ | `NOW()` | No | Creation timestamp |

**Indexes:** `demo_id`

---

### `documents`

Uploaded documents within a knowledge base.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `kb_id` | UUID | — | No | FK → knowledge_bases |
| `filename` | TEXT | — | No | Original filename |
| `content` | TEXT | — | No | Extracted text |
| `chunk_count` | INTEGER | `0` | No | Number of chunks |
| `created_at` | TIMESTAMPTZ | `NOW()` | No | Upload timestamp |

**Indexes:** `kb_id`

---

### `chunks`

Text chunks with vector embeddings for similarity search (pgvector).

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `kb_id` | UUID | — | No | FK → knowledge_bases |
| `document_id` | UUID | — | No | FK → documents |
| `content` | TEXT | — | No | Chunk text |
| `embedding` | vector(1536) | — | No | OpenRouter text-embedding-3-small |
| `chunk_index` | INTEGER | — | No | Order within document |
| `created_at` | TIMESTAMPTZ | `NOW()` | No | Creation timestamp |

**Indexes:** `kb_id`, `document_id`, HNSW on `embedding`

**RPC:** `match_chunks(kb_id, query_embedding, match_threshold, match_count)` — similarity search

---

### `rate_limits`

Configurable rate limit values.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT (PK) | Limit identifier |
| `value` | INTEGER | Limit value |
| `description` | TEXT | Human-readable description |

**Default values:**

| Key | Value | Description |
|-----|-------|-------------|
| `messages_per_demo` | 50 | Max messages per demo session |
| `demos_per_hour` | 10 | Max demos created per hour |
| `api_calls_per_minute` | 5 | Scraping rate limit |
| `tokens_per_demo` | 10,000 | Max tokens per demo |

## Row Level Security

| Table | Policy | Rule |
|-------|--------|------|
| `demos` | Select | `deleted_at IS NULL` |
| `demos` | Insert | Allow all |
| `demos` | Update | `deleted_at IS NULL` |
| `demos` | Delete | Allow all (for hard delete) |
| `leads` | All | Allow (via service role) |
| `sessions` | All | Allow (via service role) |
| `messages` | All | Allow (via service role) |

## Entity Relationships

```
demos (1) ──── (*) leads
demos (1) ──── (0..1) knowledge_bases
knowledge_bases (1) ──── (*) documents
documents (1) ──── (*) chunks
leads (1) ──── (*) sessions
sessions (1) ── (*) messages
```

## Migrations

Migrations are stored in `supabase/migrations/` and applied via `npx supabase db push`.
