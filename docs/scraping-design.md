# Task 3.3: Improved Scraping & Context Generation

> **Status:** Research & design complete. Implementation in progress.
> **Related:** Task 3.2 (Research Skill), `docs/architecture.md`, `src/lib/scraper.ts`

---

## 1. Current State

The existing scraper (`src/lib/scraper.ts`) uses:

- **Cheerio** for static HTML (single-page)
- **Jina AI** fallback for JS-heavy sites
- **Extracts:** company name, industry, products, offers, logo, `primaryColor`, description, `rawText`
- **Limitations:** Single-page only; no qualification criteria extraction; logo/color heuristics are basic; products/offers use keyword matching on headings

---

## 2. Design Decisions

### 2.1 Multi-Page Crawling

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Scope** | Optional multi-page, capped at 5 pages | Serverless timeout (~10s), rate limits, cost control |
| **Discovery** | Sitemap first (`/sitemap.xml`, `/sitemap_index.xml`), then top nav links | Sitemaps are reliable; nav links cover sites without sitemaps |
| **Fallback** | Single-page if sitemap missing or fails | Preserves current behavior |
| **Output** | Merge content from all pages; deduplicate products/offers | Richer context without breaking API shape |

**Implementation:** Fetch sitemap XML, parse `<loc>` URLs, take first 4 additional URLs (home + 4 = 5 max). Fetch in parallel with `Promise.allSettled` to avoid one slow page blocking all.

### 2.2 Structured Extraction Enhancements

| Area | Enhancement |
|------|-------------|
| **Products/Services** | Nav links, JSON-LD `Product`/`Service`, `<ul>` under "Our Products" sections, pricing table product names |
| **Pricing** | Tables with `$`, `price`, `€`; JSON-LD `offers.price`; regex for common price patterns |
| **FAQs** | FAQPage schema, `dl`/`dt`/`dd`, accordion sections with "FAQ" in heading |
| **Offers** | Expand beyond "deal/discount" to "trial", "demo", "limited", "savings"; JSON-LD `AggregateOffer` |

### 2.3 Logo & Image Detection

| Improvement | Approach |
|-------------|----------|
| **Priority** | `og:image` (if square/large) > `link[rel="icon"]` (sizes) > first header logo by `alt`/`class` |
| **Size filter** | Prefer images ≥ 64px (avoid tiny favicons when logo exists) |
| **Absolute URLs** | Resolve all relative URLs against page base |

### 2.4 Brand Color Extraction

| Source | Priority |
|-------|----------|
| `meta[name="theme-color"]` | 1 (existing) |
| `meta[name="msapplication-TileColor"]` | 2 (existing) |
| CSS custom properties `--primary`, `--brand`, `--accent` | 3 (new) |
| Inline styles on header/nav (`background`, `color`) | 4 (new) |
| Linked stylesheets | 5 (regex hex/rgb, pick most frequent non-gray) |

**Constraint:** Limit to 2 fetches for external CSS to avoid latency; parse only first 50KB of each.

### 2.5 Qualification Criteria (Auto-Generation)

| Approach | Description |
|----------|-------------|
| **Heuristics** | Extract phrases containing "qualified", "ideal customer", "enterprise", "budget", "decision maker", "B2B", "contact us for" |
| **Fallback** | Leave empty; operator edits in Context step |
| **Structure** | Array of strings, joined with ", " for form pre-fill |

---

## 3. Output Structure (Extended)

```typescript
interface ScrapeResult {
  companyName: string;
  industry: string | null;
  products: string[];
  offers: string[];
  qualifications: string[];      // NEW: auto-generated criteria
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;  // NEW: optional secondary/accent
  websiteUrl: string;
  description: string | null;
  rawText: string;
  // Optional richer fields (for future use / 3.2 integration):
  faqs?: { q: string; a: string }[];
  pricing?: { label: string; value: string }[];
}
```

**Backward compatibility:** `qualifications` maps to `qualificationCriteria` in the builder. Existing `products`, `offers` remain; we add `qualifications` and optionally `secondaryColor`, `faqs`, `pricing` for future use.

---

## 4. Integration with Builder & API

| Component | Change |
|-----------|--------|
| `ScrapeResult` | Add `qualifications`, `secondaryColor`; keep existing fields |
| `POST /api/scrape` | Return `qualifications` in response |
| `DemoBuilder` `onScrapeComplete` | Pre-fill `qualificationCriteria` from `result.qualifications.join(', ')` |
| `ContextStep` | No UI change; field already exists |

---

## 5. Task 3.2 (Research Skill) Integration — Evaluation

**Conclusion:** Scrape output is designed to be mergeable with future research output. No code changes in 3.3 required for 3.2 integration.

| Aspect | Decision |
|--------|----------|
| **Output compatibility** | `ScrapeResult` is a flat structure; research can add `summary`, `competitors`, `marketPosition` |
| **Context injection** | `rawText` remains the primary scrape-derived context for prompts |
| **Builder flow** | Research (3.2) can run after scrape; merged context populates Step 3 |
| **When to integrate** | Implement in 3.2; add `docs/research-skill-design.md` defining merge contract |

**Future merge contract:**
```
mergedContext = { ...scrapeResult, ...researchResult }
researchResult: { summary?, competitors?, marketPosition? }
```

---

## 6. Implementation Phases

1. **Phase A (3.3.1):** Extend single-page extraction
   - Add qualifications heuristics
   - Improve products/offers extraction (JSON-LD, nav, sections)
   - Add secondary color from CSS
   - Improve logo selection (size, priority)

2. **Phase B (3.3.2):** Optional multi-page ✅ Implemented
   - Sitemap discovery (`/sitemap.xml`, `/sitemap_index.xml`) and URL extraction
   - Nav link fallback when no sitemap
   - Parallel fetch of up to 5 pages (home + 4)
   - Merge and deduplicate products, offers, qualifications, rawText
   - `multiPage` option (default: true) via API body and `ScrapeOptions`

3. **Phase C (3.3.3):** Optional FAQs and pricing
   - Extract FAQ structure
   - Extract pricing snippets
   - Include in `rawText` or as structured fields for prompts

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Timeout on multi-page | Cap pages (5), use `Promise.race` with timeout per page |
| Sitemap too large | Take first N URLs only |
| Blocked by robots/crawlers | Keep respectful User-Agent; no stealth crawling |
| Jina fallback loses enhancements | Jina returns markdown; run qualification/products keyword extraction on Jina output too |

---

## 8. Testing

- Unit tests for new extractors (`extractQualifications`, `extractSecondaryColor`, sitemap parser)
- Integration test: POST /api/scrape returns `qualifications`
- E2E: Builder Step 2 → Step 3 shows pre-filled qualification criteria when available
