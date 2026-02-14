# Security

THE LAB security measures for API, scraping, and data access.

## Input Validation

All API routes validate inputs before processing:

| Endpoint | Validations |
|----------|-------------|
| `POST /api/scrape` | URL format, SSRF protection (no localhost/private IPs) |
| `POST /api/demo` | mission_profile enum, URL, hex colors, string length limits |
| `PATCH /api/demo/[id]` | UUID for id, URL, hex colors, string limits |
| `GET /api/demo/[id]` | UUID for id |
| `DELETE /api/demo/[id]` | UUID for id |
| `POST /api/chat` | UUID for demoId, message length (4096), leadIdentifier format |
| `GET /api/chat` | UUID for demoId, leadIdentifier format |

Validation utilities: `src/lib/validation.ts`

## Scraped Content Sanitization

Scraped content is sanitized before storage/display to prevent XSS:

- HTML tags stripped from text fields
- Script/style tags removed
- `javascript:` and `data:` URLs rejected for logo/links
- String length limits applied

Utilities: `src/lib/sanitize.ts`

## CORS

API routes use CORS middleware (`src/middleware.ts`):

- **Allowed origins**: `localhost:3000`, `127.0.0.1:3000`, `NEXT_PUBLIC_APP_URL`
- **Methods**: GET, POST, PATCH, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization
- Cross-origin requests from non-allowed origins are blocked (no CORS headers)

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `POST /api/scrape` | 5 requests / minute / IP |
| `POST /api/demo` | 20 requests / minute / IP |
| `GET /api/demo` | 20 requests / minute / IP |
| `GET/PATCH/DELETE /api/demo/[id]` | 20 requests / minute / IP |
| `POST /api/chat` | 60 requests / minute / IP |
| `GET /api/chat` | 60 requests / minute / IP |

Implementation: `src/lib/rateLimit.ts` (in-memory; resets on serverless cold start)

## Supabase RLS Policies — Audit

The server uses **service role** client, which bypasses RLS. RLS protects direct Supabase access (e.g. anon key from browser). Current policies:

### demos

| Policy | Rule | Notes |
|--------|------|-------|
| Select | `deleted_at IS NULL` | Hides soft-deleted rows |
| Insert | `WITH CHECK (true)` | Anyone can create |
| Update | `deleted_at IS NULL` | Update only non-deleted |
| Delete | `USING (true)` | Hard delete allowed (admin flows) |

**Recommendation**: Enforce role-scoped access for internal modules: `super_admin` can access all, `operator` is constrained by `created_by` (or explicit team rules). Currently `created_by` filtering is enforced in API routes only.

### leads, sessions, messages

| Table | Policies | Notes |
|-------|----------|-------|
| leads | Select/Insert/Update: allow all | Service role bypasses; anon would need restrict |
| sessions | Select/Insert/Update: allow all | Same |
| messages | Select/Insert: allow all | Same |

**Recommendation**: These tables are written by the server only. If the frontend ever queries them directly, add policies that scope by `demo_id` and verify the requester has access to that demo. Currently the chat UI uses API routes, so RLS is a secondary layer.

### rate_limits

| Policy | Rule |
|--------|------|
| Select | `USING (true)` |

Read-only config; acceptable.

## Summary

- **Validation**: All user inputs validated; SSRF protection on URLs
- **Sanitization**: Scraped content stripped of HTML/scripts
- **CORS**: Explicit allowlist of origins
- **Rate limiting**: All API routes rate limited by IP
- **RLS**: Policies exclude soft-deleted demos; role-based creator scoping is the internal model

## Tenancy Model

- Internal surfaces (RECON, RADAR, THE LAB, MISSION CONTROL) are role-scoped and do not require workspace scoping.
- Tenant isolation (`workspace_id`) is reserved for BLUEPRINT client deployments and CLIENT PORTAL views.
