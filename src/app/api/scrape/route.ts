import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite, ScrapeResult } from '@/lib/scraper';
import { validateUrl } from '@/lib/validation';
import { getClientIp, checkRateLimit, SCRAPE_LIMIT } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`scrape:${ip}`, SCRAPE_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Maximum 5 requests per minute.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { url } = body;

        const urlResult = validateUrl(url);
        if (!urlResult.valid) {
            return NextResponse.json(
                { error: urlResult.error },
                { status: 400 }
            );
        }

        const result: ScrapeResult = await scrapeWebsite(urlResult.url);

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
