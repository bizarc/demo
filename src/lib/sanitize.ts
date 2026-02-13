/**
 * Sanitization utilities for user-generated and scraped content.
 * Prevents XSS and injection when content is rendered or stored.
 */

/** Strip HTML tags and decode entities from text */
function stripHtml(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Remove javascript: and data: URLs which can execute scripts */
function sanitizeUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) return null;
    return trimmed;
}

/**
 * Sanitizes text extracted from scraped HTML.
 * Removes script/style tags, HTML tags, and normalizes whitespace.
 */
export function sanitizeScrapedText(text: string | null | undefined, maxLength = 5000): string {
    if (!text || typeof text !== 'string') return '';
    const stripped = stripHtml(text);
    return stripped.slice(0, maxLength);
}

/**
 * Sanitizes a single string field (company name, industry, etc.).
 */
export function sanitizeTextField(
    value: string | null | undefined,
    maxLength = 500
): string {
    if (!value || typeof value !== 'string') return '';
    return stripHtml(value.trim()).slice(0, maxLength);
}

/**
 * Sanitizes a URL (e.g. logo, website).
 * Returns null if URL is dangerous (javascript:, data:).
 */
export function sanitizeScrapedUrl(url: string | null | undefined): string | null {
    return sanitizeUrl(url);
}

/**
 * Sanitizes an array of strings (products, offers).
 */
export function sanitizeStringArray(
    arr: string[] | null | undefined,
    maxItems = 10,
    maxItemLength = 500
): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .slice(0, maxItems)
        .map((item) => sanitizeTextField(item, maxItemLength))
        .filter(Boolean);
}
