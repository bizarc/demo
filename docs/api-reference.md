# API Reference

All endpoints are Next.js API Routes under `src/app/api/`.

## Demo Management

> **Tenancy note:** Demo APIs are internal and role-scoped (`super_admin`, `operator`). They are not workspace-scoped.

### `POST /api/demo` — Create demo

Creates a new demo (draft or active).

**Request:**

```json
{
  "status": "draft",           // "draft" | "active"
  "mission_profile": "reactivation",
  "company_name": "Acme Corp",
  "website_url": "https://acme.com",
  "industry": "Technology",
  "products_services": ["Widget Pro", "Widget Lite"],
  "offers": ["20% off annual plans"],
  "qualification_criteria": ["Budget > $10k"],
  "logo_url": "https://...",
  "primary_color": "#2563EB",
  "openrouter_model": "openai/gpt-4o-mini",
  "created_by": "creator-uuid",
  "current_step": "mission"
}
```

**Draft mode:** Minimal validation, all fields optional except `status`.

**Active mode:** Full validation, generates `system_prompt` and sets `expires_at` (7 days).

**Response:** `201 Created`

```json
{ "id": "uuid", "status": "draft" }
```

---

### `GET /api/demo` — List demos

**Query params:**

| Param | Required | Description |
|-------|----------|-------------|
| `created_by` | Yes | Filter by creator ID |
| `status` | No | Filter by status (`draft`, `active`, `expired`, `blueprint`) |

**Response:** `200 OK`

```json
{
  "demos": [
    {
      "id": "uuid",
      "company_name": "Acme Corp",
      "status": "active",
      "mission_profile": "reactivation",
      "updated_at": "2026-02-10T...",
      "expires_at": "2026-02-17T..."
    }
  ]
}
```

---

### `GET /api/demo/[id]` — Get demo by ID

Returns full demo configuration. Checks expiration for active demos.

**Response:** `200 OK` — Full demo object

**Errors:** `404` (not found), `410` (expired)

---

### `PATCH /api/demo/[id]` — Update demo

Used for autosave (partial updates) and activation (draft → active).

**Request (autosave):**

```json
{
  "company_name": "Updated Name",
  "current_step": "context",
  "knowledge_base_id": "uuid"
}
```

| Field | Description |
|-------|-------------|
| `knowledge_base_id` | Optional. UUID of knowledge base for RAG. Set to `null` to detach. |

**Request (activation):**

```json
{
  "status": "active"
}
```

On activation: validates required fields, generates `system_prompt`, sets `expires_at`.

**Response:** `200 OK`

```json
{ "id": "uuid", "status": "active", "updated_at": "...", "expires_at": "..." }
```

---

### `DELETE /api/demo/[id]` — Delete demo

Soft delete by default. Hard delete with `?hard=true`.

**Response:** `200 OK`

```json
{ "deleted": true }
```

---

## Chat

### `POST /api/chat` — Send message

Session-aware chat with streaming AI responses.

**Request:**

```json
{
  "demoId": "uuid",
  "message": "Hello, what services do you offer?",
  "leadIdentifier": "lead-nanoid",    // Optional — omit for preview mode
  "history": []                         // Optional — client-side fallback
}
```

**Response:** `200 OK` (Server-Sent Events)

```
data: {"token": "Hello"}
data: {"token": "! How"}
data: {"token": " can I"}
data: {"token": " help?"}
data: {"done": true, "tokenCount": 15}
data: [DONE]
```

**Behavior:**

- When `leadIdentifier` is provided: creates lead/session, persists messages, tracks tokens
- When omitted (preview mode): no persistence, no token limits
- Draft demos: skips expiration check, generates system prompt on-the-fly
- Token limit: 10,000 per demo (configurable)
- History: loads last 50 messages from DB

---

### `GET /api/chat` — Load history

**Query params:**

| Param | Required | Description |
|-------|----------|-------------|
| `demoId` | Yes | Demo UUID |
| `leadIdentifier` | Yes | Lead identifier |

**Response:** `200 OK`

```json
{
  "messages": [
    { "role": "assistant", "content": "Welcome!", "created_at": "..." },
    { "role": "user", "content": "Tell me about...", "created_at": "..." }
  ]
}
```

---

## Scraping

### `POST /api/scrape` — Scrape URL

**Request:**

```json
{
  "url": "https://example.com",
  "multiPage": true
}
```

| Param | Required | Description |
|-------|----------|--------------|
| `url` | Yes | Website URL to scrape |
| `multiPage` | No | When true (default), crawl up to 5 pages via sitemap/nav and merge context |

**Response:** `200 OK`

```json
{
  "companyName": "Example Corp",
  "industry": "Technology",
  "products": ["Product A", "Product B"],
  "offers": ["Free trial"],
  "qualifications": ["Ideal for enterprise customers", "Budget-conscious organizations"],
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#FF5733",
  "secondaryColor": "#10B981",
  "websiteUrl": "https://example.com",
  "description": "Company description..."
}
```

**Fields:**
- `qualifications` — Auto-extracted qualification criteria (heuristics)
- `secondaryColor` — Secondary/accent color from CSS when detected

**Rate limit:** 5 requests per minute

**Errors:** `429` (rate limited), `500` (scrape failed)

---

## Knowledge Base (RAG)

### `POST /api/knowledge-base` — Create knowledge base

Creates a knowledge base for a demo.

**Request:**

```json
{
  "demoId": "uuid",
  "name": "Default",
  "type": "custom"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `demoId` | Yes | Demo UUID |
| `name` | No | Display name (default: "Default") |
| `type` | No | `product_catalog`, `faq`, `service_menu`, `review_template`, or `custom` |

**Response:** `201 Created`

```json
{ "id": "uuid", "demo_id": "uuid", "name": "Default", "type": "custom" }
```

---

### `GET /api/knowledge-base/[id]` — List documents

Returns knowledge base metadata and list of uploaded documents.

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "demo_id": "uuid",
  "name": "Default",
  "type": "custom",
  "documents": [
    { "id": "uuid", "filename": "faq.md", "chunk_count": 12, "created_at": "..." }
  ],
  "totalChunks": 45
}
```

---

### `POST /api/knowledge-base/[id]/upload` — Upload document

Ingests a document (parse, chunk, embed, store). Multipart form-data.

**Request:** `Content-Type: multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| `file` | Yes | File (.txt, .md, .csv, .pdf, max 2 MB) |

**Response:** `201 Created`

```json
{ "id": "uuid", "filename": "faq.md", "chunk_count": 12 }
```

**Limits:** 10 files per KB, 500 chunks per KB

---

### `DELETE /api/knowledge-base/[id]/documents/[docId]` — Remove document

Deletes a document and its chunks.

**Response:** `200 OK`

```json
{ "deleted": true }
```

---

**RAG behavior:** When a demo has `knowledge_base_id` set, the chat API retrieves relevant chunks for each user message and injects them into the system prompt before generating a response.

## RECON Research

### `POST /api/research` — Run company intelligence research

Runs AI research (Perplexity via OpenRouter) and returns structured company context. In environments with RECON research tables migrated, results are persisted to `research_records`.

**Tenancy note:** RECON research is platform-global internal (outside workspaces). BLUEPRINT/client-portal tenant isolation is applied in downstream client-facing systems.

---

### `GET /api/research` — List research records

Lists stored research records (when persistence tables are present), optionally filterable by status.
