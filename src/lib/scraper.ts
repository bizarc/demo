import * as cheerio from 'cheerio';

export interface ScrapeResult {
    companyName: string;
    industry: string | null;
    products: string[];
    offers: string[];
    logoUrl: string | null;
    primaryColor: string | null;
    websiteUrl: string;
    description: string | null;
    rawText: string;
}

export interface ScrapeOptions {
    useJinaFallback?: boolean;
    timeout?: number;
}

/**
 * Scrape a website URL and extract business information
 */
export async function scrapeWebsite(
    url: string,
    options: ScrapeOptions = {}
): Promise<ScrapeResult> {
    const { useJinaFallback = true, timeout = 10000 } = options;

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
        // Try Cheerio-based scraping first
        const result = await scrapeWithCheerio(normalizedUrl, timeout);
        return result;
    } catch (error) {
        // If Cheerio fails and Jina fallback is enabled, try Jina
        if (useJinaFallback && process.env.JINA_API_KEY) {
            console.log('Cheerio scrape failed, trying Jina AI fallback...');
            return await scrapeWithJina(normalizedUrl);
        }
        throw error;
    }
}

/**
 * Scrape using Cheerio (for static HTML sites)
 */
async function scrapeWithCheerio(url: string, timeout: number): Promise<ScrapeResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TheLab/1.0; +https://thelab.demo)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract basic info
        const title = $('title').first().text().trim();
        const metaDescription = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || null;
        const h1 = $('h1').first().text().trim();

        // Extract company name (try various sources)
        const companyName = extractCompanyName($, title, url);

        // Extract logo
        const logoUrl = extractLogo($, url);

        // Extract primary color
        const primaryColor = extractPrimaryColor($);

        // Extract body text for context
        const rawText = extractBodyText($);

        // Extract products/services from page content
        const { products, offers } = extractProductsAndOffers($);

        // Try to determine industry
        const industry = inferIndustry(rawText, companyName);

        return {
            companyName,
            industry,
            products,
            offers,
            logoUrl,
            primaryColor,
            websiteUrl: url,
            description: metaDescription || h1 || null,
            rawText: rawText.slice(0, 5000), // Limit raw text length
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Scrape using Jina AI Reader (for JS-heavy sites)
 */
async function scrapeWithJina(url: string): Promise<ScrapeResult> {
    const jinaUrl = `https://r.jina.ai/${url}`;

    const response = await fetch(jinaUrl, {
        headers: {
            'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Jina API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content || data.text || '';

    // Parse the markdown/text content
    const lines = content.split('\n');
    const title = lines[0]?.replace(/^#\s*/, '').trim() || 'Unknown';

    return {
        companyName: title,
        industry: inferIndustry(content, title),
        products: extractKeywords(content, ['product', 'service', 'solution', 'offer']),
        offers: extractKeywords(content, ['deal', 'discount', 'free', 'trial', 'demo']),
        logoUrl: null, // Jina doesn't provide logo
        primaryColor: null, // Jina doesn't provide colors
        websiteUrl: url,
        description: lines.slice(0, 3).join(' ').slice(0, 200),
        rawText: content.slice(0, 5000),
    };
}

// Helper functions

function extractCompanyName($: cheerio.CheerioAPI, title: string, url: string): string {
    // Try og:site_name first
    const siteName = $('meta[property="og:site_name"]').attr('content');
    if (siteName) return siteName;

    // Try structured data
    const jsonLd = $('script[type="application/ld+json"]').first().html();
    if (jsonLd) {
        try {
            const data = JSON.parse(jsonLd);
            if (data.name) return data.name;
            if (data.organization?.name) return data.organization.name;
        } catch {
            // Ignore JSON parse errors
        }
    }

    // Parse from title (remove common suffixes)
    const cleanTitle = title
        .split(/\s*[\|\-–—]\s*/)[0]
        .replace(/\s*(Home|Homepage|Official Site|Official Website)$/i, '')
        .trim();

    if (cleanTitle) return cleanTitle;

    // Fallback to domain name
    try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
        return 'Unknown Company';
    }
}

function extractLogo($: cheerio.CheerioAPI, baseUrl: string): string | null {
    // Try various logo sources
    const sources = [
        $('meta[property="og:image"]').attr('content'),
        $('link[rel="icon"]').attr('href'),
        $('link[rel="shortcut icon"]').attr('href'),
        $('link[rel="apple-touch-icon"]').attr('href'),
        $('img[alt*="logo" i]').first().attr('src'),
        $('img[class*="logo" i]').first().attr('src'),
        $('img[id*="logo" i]').first().attr('src'),
    ];

    for (const src of sources) {
        if (src) {
            // Convert relative URLs to absolute
            try {
                return new URL(src, baseUrl).href;
            } catch {
                continue;
            }
        }
    }

    return null;
}

function extractPrimaryColor($: cheerio.CheerioAPI): string | null {
    // Try theme-color meta tag
    const themeColor = $('meta[name="theme-color"]').attr('content');
    if (themeColor) return themeColor;

    // Try msapplication-TileColor
    const tileColor = $('meta[name="msapplication-TileColor"]').attr('content');
    if (tileColor) return tileColor;

    // Could also parse CSS/inline styles, but that's more complex
    return null;
}

function extractBodyText($: cheerio.CheerioAPI): string {
    // Remove script, style, and other non-content elements
    $('script, style, nav, footer, header, aside, .nav, .footer, .header, .sidebar').remove();

    const text = $('body').text()
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

    return text;
}

function extractProductsAndOffers($: cheerio.CheerioAPI): { products: string[]; offers: string[] } {
    const products: string[] = [];
    const offers: string[] = [];

    // Look for product/service sections
    $('h2, h3, h4').each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('product') || text.includes('service') || text.includes('solution')) {
            const nextText = $(el).next().text().trim();
            if (nextText && nextText.length < 200) {
                products.push(nextText);
            }
        }
        if (text.includes('offer') || text.includes('deal') || text.includes('pricing')) {
            const nextText = $(el).next().text().trim();
            if (nextText && nextText.length < 200) {
                offers.push(nextText);
            }
        }
    });

    // Extract from structured data
    const jsonLd = $('script[type="application/ld+json"]').first().html();
    if (jsonLd) {
        try {
            const data = JSON.parse(jsonLd);
            if (data.offers) {
                offers.push(typeof data.offers === 'string' ? data.offers : JSON.stringify(data.offers));
            }
        } catch {
            // Ignore
        }
    }

    return {
        products: products.slice(0, 5),
        offers: offers.slice(0, 3)
    };
}

function extractKeywords(text: string, keywords: string[]): string[] {
    const results: string[] = [];
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        for (const keyword of keywords) {
            if (lowerSentence.includes(keyword) && sentence.trim().length < 200) {
                results.push(sentence.trim());
                break;
            }
        }
        if (results.length >= 5) break;
    }

    return results;
}

function inferIndustry(text: string, companyName: string): string | null {
    const lowerText = (text + ' ' + companyName).toLowerCase();

    const industryKeywords: Record<string, string[]> = {
        'Technology': ['software', 'saas', 'tech', 'digital', 'ai', 'machine learning', 'cloud', 'platform'],
        'E-commerce': ['shop', 'store', 'buy', 'cart', 'ecommerce', 'e-commerce', 'retail'],
        'Healthcare': ['health', 'medical', 'doctor', 'patient', 'hospital', 'clinic', 'wellness'],
        'Finance': ['bank', 'finance', 'invest', 'loan', 'insurance', 'payment', 'fintech'],
        'Real Estate': ['real estate', 'property', 'home', 'apartment', 'rental', 'housing'],
        'Education': ['learn', 'course', 'education', 'training', 'school', 'university', 'tutorial'],
        'Marketing': ['marketing', 'advertising', 'seo', 'social media', 'brand', 'agency'],
        'Food & Beverage': ['food', 'restaurant', 'drink', 'menu', 'delivery', 'cuisine'],
        'Travel': ['travel', 'hotel', 'flight', 'booking', 'vacation', 'tourism'],
        'Automotive': ['car', 'auto', 'vehicle', 'dealer', 'automotive'],
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return industry;
            }
        }
    }

    return null;
}
