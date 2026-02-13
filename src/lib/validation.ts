/**
 * Input validation utilities for API security.
 * Used across demo, chat, and scrape routes.
 */

/** UUID format (8-4-4-4-12 hex with dashes) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Hex color: #RGB, #RRGGBB, or #RRRGGGBBB */
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

/** Nanoid-style identifier: alphanumeric, typically 21 chars */
const NANOID_REGEX = /^[A-Za-z0-9_-]{10,64}$/;

/** Blocked URL hosts for SSRF protection */
const BLOCKED_HOSTS = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.0.0', // link-local
]);

function isPrivateOrLoopback(hostname: string): boolean {
    const lower = hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(lower)) return true;
    if (lower.endsWith('.local')) return true;
    // Private IP ranges: 10.x, 172.16-31.x, 192.168.x
    if (/^10\./i.test(lower)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./i.test(lower)) return true;
    if (/^192\.168\./i.test(lower)) return true;
    return false;
}

/**
 * Validates a string is a valid UUID (Supabase format).
 */
export function isValidUuid(str: string): boolean {
    return typeof str === 'string' && UUID_REGEX.test(str.trim());
}

/**
 * Validates and normalizes a URL. Returns the normalized URL or null if invalid.
 * Blocks private/localhost URLs for SSRF protection.
 */
export function validateUrl(url: string): { valid: true; url: string } | { valid: false; error: string } {
    if (typeof url !== 'string' || !url.trim()) {
        return { valid: false, error: 'URL is required' };
    }
    const trimmed = url.trim();
    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    let parsed: URL;
    try {
        parsed = new URL(normalized);
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'URL must use http or https' };
    }
    const host = parsed.hostname;
    if (isPrivateOrLoopback(host)) {
        return { valid: false, error: 'Private and localhost URLs are not allowed' };
    }
    return { valid: true, url: normalized };
}

/**
 * Validates a hex color string.
 */
export function isValidHexColor(str: string): boolean {
    return typeof str === 'string' && HEX_COLOR_REGEX.test(str.trim());
}

/**
 * Validates a lead identifier (nanoid stored in localStorage).
 */
export function isValidLeadIdentifier(str: string): boolean {
    return typeof str === 'string' && NANOID_REGEX.test(str);
}

/**
 * Trims and truncates a string to maxLength. Returns empty string for invalid input.
 */
export function sanitizeString(str: unknown, maxLength: number): string {
    if (str === undefined || str === null) return '';
    const s = String(str).trim();
    return s.slice(0, maxLength);
}

/**
 * Validates and sanitizes an array of strings (e.g. products_services, offers).
 */
export function sanitizeStringArray(
    val: unknown,
    maxItems: number,
    maxItemLength: number
): string[] {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : String(val).split(',').map((s) => String(s).trim());
    return arr
        .filter(Boolean)
        .slice(0, maxItems)
        .map((s) => sanitizeString(s, maxItemLength));
}

/** Max lengths for demo fields (per IMPLEMENTATION_PLAN) */
export const LIMITS = {
    companyName: 500,
    industry: 200,
    websiteUrl: 2048,
    logoUrl: 2048,
    openrouterModel: 200,
    messageContent: 4096,
    historyMessages: 50,
    productsServicesItems: 20,
    offersItems: 20,
    qualificationItems: 20,
    itemLength: 500,
    creatorId: 64,
    currentStep: 50,
} as const;
