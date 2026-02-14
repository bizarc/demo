import { describe, it, expect, vi } from 'vitest';
import { POST } from '../scrape/route';
import { createMockRequest } from './helpers';
import { scrapeWebsite } from '@/lib/scraper';

vi.mock('@/lib/scraper', () => ({
    scrapeWebsite: vi.fn().mockResolvedValue({
        companyName: 'Example Corp',
        industry: 'Technology',
        products: ['Product A', 'Product B'],
        offers: ['Free trial'],
        qualifications: ['Ideal for enterprise customers', 'Budget-conscious organizations'],
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#2563EB',
        secondaryColor: null,
        websiteUrl: 'https://example.com',
        description: 'Example description',
        rawText: 'Example raw text',
    }),
}));

describe('POST /api/scrape', () => {
    const baseUrl = 'http://localhost/api/scrape';

    it('returns 400 when url is missing', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: {},
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('URL is required');
    });

    it('returns 400 for localhost/private URLs (SSRF protection)', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { url: 'http://localhost/admin' },
        });
        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toMatch(/private|localhost|not allowed/i);
    });

    it('returns 400 for invalid URL format', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { url: 'https://[invalid' },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Invalid URL format');
    });

    it('returns scrape result for valid URL', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { url: 'https://example.com' },
            headers: { 'x-forwarded-for': '1.2.3.4' },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.companyName).toBe('Example Corp');
        expect(data.data.industry).toBe('Technology');
        expect(data.data.products).toEqual(['Product A', 'Product B']);
        expect(data.data.offers).toEqual(['Free trial']);
        expect(data.data.qualifications).toEqual(['Ideal for enterprise customers', 'Budget-conscious organizations']);
        expect(data.data.logoUrl).toBe('https://example.com/logo.png');
        expect(scrapeWebsite).toHaveBeenCalledWith('https://example.com', { multiPage: true });
    });

    it('passes multiPage: false when requested', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { url: 'https://example.com', multiPage: false },
            headers: { 'x-forwarded-for': '9.9.9.9' },
        });
        await POST(req);
        expect(scrapeWebsite).toHaveBeenCalledWith('https://example.com', { multiPage: false });
    });

    it('returns 429 when rate limit exceeded', async () => {
        const ip = `test-rate-limit-${Date.now()}`;

        // Make 5 requests (at limit)
        for (let i = 0; i < 5; i++) {
            const req = createMockRequest(baseUrl, {
                method: 'POST',
                body: { url: 'https://example.com' },
                headers: { 'x-forwarded-for': ip },
            });
            const res = await POST(req);
            expect(res.status).toBe(200);
        }

        // 6th request should be rate limited
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { url: 'https://example.com' },
            headers: { 'x-forwarded-for': ip },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(429);
        expect(data.error).toContain('Rate limit exceeded');
    });
});
