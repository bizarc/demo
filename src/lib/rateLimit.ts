/**
 * Shared rate limiting for API routes.
 * Uses in-memory storage (resets on cold start in serverless).
 * For production at scale, consider Redis or similar.
 */

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const storage = new Map<string, RateLimitRecord>();

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

/** Get client IP from request headers */
export function getClientIp(request: Request): string {
    if (request instanceof Request) {
        const forwarded = request.headers.get('x-forwarded-for');
        if (forwarded) return forwarded.split(',')[0].trim();
        const realIp = request.headers.get('x-real-ip');
        if (realIp) return realIp;
    }
    return 'unknown';
}

/**
 * Check rate limit. Returns true if allowed, false if exceeded.
 * Uses a composite key of prefix + identifier (e.g. IP or demoId).
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = storage.get(key);

    if (!record || now > record.resetTime) {
        storage.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return { allowed: true, remaining: config.maxRequests - 1 };
    }

    if (record.count >= config.maxRequests) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: config.maxRequests - record.count };
}

/** Scrape: 5 per minute per IP */
export const SCRAPE_LIMIT: RateLimitConfig = {
    maxRequests: 5,
    windowMs: 60 * 1000,
};

/** Demo create/list: 20 per minute per IP (builder activity) */
export const DEMO_LIMIT: RateLimitConfig = {
    maxRequests: 20,
    windowMs: 60 * 1000,
};

/** Chat: 60 per minute per IP (1 msg/sec burst) */
export const CHAT_LIMIT: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60 * 1000,
};
