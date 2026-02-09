import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite, ScrapeResult } from '@/lib/scraper';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // calls per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Maximum 5 requests per minute.' },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { url } = body;

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Scrape the website
        const result: ScrapeResult = await scrapeWebsite(url);

        return NextResponse.json({
            success: true,
            data: {
                companyName: result.companyName,
                industry: result.industry,
                products: result.products,
                offers: result.offers,
                logoUrl: result.logoUrl,
                primaryColor: result.primaryColor,
                websiteUrl: result.websiteUrl,
                description: result.description,
            },
        });
    } catch (error) {
        console.error('Scrape error:', error);

        const message = error instanceof Error ? error.message : 'Failed to scrape website';

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
