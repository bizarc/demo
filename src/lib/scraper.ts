import * as cheerio from 'cheerio';
import {
    sanitizeScrapedText,
    sanitizeTextField,
    sanitizeScrapedUrl,
    sanitizeStringArray,
} from './sanitize';

export interface ScrapeResult {
    companyName: string;
    industry: string | null;
    products: string[];
    offers: string[];
    /** Auto-generated qualification criteria (heuristics from page content) */
    qualifications: string[];
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
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

        // Extract qualification criteria (heuristics)
        const qualifications = extractQualifications(rawText);

        // Extract secondary color from CSS
        const secondaryColor = extractSecondaryColor($);

        // Try to determine industry
        const industry = inferIndustry(rawText, companyName);

        return {
            companyName: sanitizeTextField(companyName, 500),
            industry: industry ? sanitizeTextField(industry, 200) : null,
            products: sanitizeStringArray(products, 5, 200),
            offers: sanitizeStringArray(offers, 5, 200),
            qualifications: sanitizeStringArray(qualifications, 5, 200),
            logoUrl: sanitizeScrapedUrl(logoUrl),
            primaryColor: primaryColor ? sanitizeTextField(primaryColor, 20) : null,
            secondaryColor: secondaryColor ? sanitizeTextField(secondaryColor, 20) : null,
            websiteUrl: url,
            description: metaDescription || h1
                ? sanitizeScrapedText(metaDescription || h1, 500)
                : null,
            rawText: sanitizeScrapedText(rawText, 5000),
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

    const products = sanitizeStringArray(
        extractKeywords(content, ['product', 'service', 'solution', 'offer']),
        5,
        200
    );
    const offers = sanitizeStringArray(
        extractKeywords(content, ['deal', 'discount', 'free', 'trial', 'demo', 'limited', 'savings']),
        5,
        200
    );
    const qualifications = sanitizeStringArray(extractQualifications(content), 5, 200);

    return {
        companyName: sanitizeTextField(title, 500),
        industry: (() => {
            const ind = inferIndustry(content, title);
            return ind ? sanitizeTextField(ind, 200) : null;
        })(),
        products,
        offers,
        qualifications,
        logoUrl: null, // Jina doesn't provide logo
        primaryColor: null, // Jina doesn't provide colors
        secondaryColor: null, // Jina doesn't provide colors
        websiteUrl: url,
        description: sanitizeScrapedText(lines.slice(0, 3).join(' '), 200),
        rawText: sanitizeScrapedText(content, 5000),
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
    const seenP = new Set<string>();
    const seenO = new Set<string>();

    const addProduct = (s: string) => {
        const key = s.trim().toLowerCase().slice(0, 80);
        if (key && key.length > 3 && !seenP.has(key)) {
            seenP.add(key);
            products.push(s.trim());
        }
    };
    const addOffer = (s: string) => {
        const key = s.trim().toLowerCase().slice(0, 80);
        if (key && key.length > 3 && !seenO.has(key)) {
            seenO.add(key);
            offers.push(s.trim());
        }
    };

    // Look for product/service sections (headings + following content)
    $('h2, h3, h4').each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('product') || text.includes('service') || text.includes('solution') || text.includes('what we')) {
            const nextText = $(el).next().text().trim();
            if (nextText && nextText.length < 200) addProduct(nextText);
        }
        if (text.includes('offer') || text.includes('deal') || text.includes('pricing') || text.includes('promo')) {
            const nextText = $(el).next().text().trim();
            if (nextText && nextText.length < 200) addOffer(nextText);
        }
    });

    // Extract from nav links (Products, Services, Solutions)
    $('nav a, header a, .nav a, .header a, [role="navigation"] a').each((_, el) => {
        const text = $(el).text().trim();
        if (!text || text.length > 50) return;
        const lower = text.toLowerCase();
        if (lower.includes('product') || lower.includes('service') || lower.includes('solution') || lower === 'pricing') {
            addProduct(text);
        }
        if (lower.includes('deal') || lower.includes('offer') || lower.includes('free trial') || lower.includes('demo')) {
            addOffer(text);
        }
    });

    // Extract from JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
        const html = $(el).html();
        if (!html) return;
        try {
            const data = typeof html === 'string' ? JSON.parse(html) : null;
            if (!data) return;
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (item['@type'] === 'Product' && item.name) addProduct(String(item.name));
                if (item['@type'] === 'Service' && item.name) addProduct(String(item.name));
                if (item.offers) {
                    const off = item.offers;
                    const arr = Array.isArray(off) ? off : [off];
                    for (const o of arr) {
                        if (o.price || o.priceSpecification?.price) {
                            addOffer(String(o.price ?? o.priceSpecification?.price ?? JSON.stringify(o)));
                        }
                    }
                }
            }
        } catch {
            // Ignore parse errors
        }
    });

    return {
        products: products.slice(0, 8),
        offers: offers.slice(0, 5),
    };
}

/** Extract qualification criteria from page text using heuristics */
function extractQualifications(text: string): string[] {
    const results: string[] = [];

    const patterns = [
        /\b(ideal (?:for|customer|candidate)s?[^.]{5,120})/gi,
        /\b(qualified (?:leads?|customers?|buyers?)[^.]{5,100})/gi,
        /\b(enterprise(?:\s+(?:customers?|clients?|organizations?))?[^.]{5,80})/gi,
        /\b(budget[^.]{5,80})/gi,
        /\b(decision[- ]?makers?[^.]{5,80})/gi,
        /\b(b2b[^.]{5,80})/gi,
        /\b(contact us (?:for|to|if)[^.]{5,100})/gi,
        /\b(eligib(?:le|ility)[^.]{5,80})/gi,
];

    for (const re of patterns) {
        const matches = text.matchAll(re);
        for (const m of matches) {
            const s = m[1]?.trim().replace(/\s+/g, ' ');
            if (s && s.length >= 15 && s.length <= 150) {
                results.push(s);
            }
        }
    }

    return [...new Set(results)].slice(0, 5);
}

/** Extract secondary/accent color from CSS custom properties and inline styles */
function extractSecondaryColor($: cheerio.CheerioAPI): string | null {
    // Inline styles on header/nav - look for --accent, --secondary, --brand
    const inlineStyles: string[] = [];
    $('header, nav, .header, .nav, [role="banner"]').each((_, el) => {
        const style = $(el).attr('style');
        if (style) inlineStyles.push(style);
    });

    const cssText = inlineStyles.join(' ');
    const hexMatches = cssText.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexMatches) {
        // Filter out grays and very light/dark
        const candidates = hexMatches.filter((h) => {
            const r = parseInt(h.slice(1, 3), 16);
            const g = parseInt(h.slice(3, 5) || '0', 16);
            const b = parseInt(h.slice(5, 7) || '0', 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.15 && luminance < 0.9 && (r !== g || g !== b);
        });
        if (candidates.length > 0) return candidates[0];
    }

    return null;
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
