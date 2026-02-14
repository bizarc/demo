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
    /** When true, crawl up to 5 pages (sitemap or nav links) and merge context. Default: true */
    multiPage?: boolean;
}

/** Maximum pages to crawl in multi-page mode (home + N additional) */
const MAX_PAGES = 5;
const PER_PAGE_TIMEOUT = 5000;

/**
 * Scrape a website URL and extract business information
 */
export async function scrapeWebsite(
    url: string,
    options: ScrapeOptions = {}
): Promise<ScrapeResult> {
    const { useJinaFallback = true, timeout = 10000, multiPage = true } = options;

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
        const result = await scrapeWithCheerio(normalizedUrl, timeout, multiPage);
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

const FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; TheLab/1.0; +https://thelab.demo)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

/**
 * Scrape using Cheerio (for static HTML sites)
 */
async function scrapeWithCheerio(url: string, timeout: number, multiPage: boolean): Promise<ScrapeResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: FETCH_HEADERS,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract from homepage first
        const title = $('title').first().text().trim();
        const metaDescription = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || null;
        const h1 = $('h1').first().text().trim();

        const companyName = extractCompanyName($, title, url);
        const logoUrl = extractLogo($, url);
        const primaryColor = extractPrimaryColor($);
        const secondaryColor = extractSecondaryColor($);
        let rawText = extractBodyText($);
        let { products, offers } = extractProductsAndOffers($);
        let qualifications = extractQualifications(rawText);

        // Multi-page: discover and fetch additional URLs
        const additionalUrls: string[] = multiPage
            ? await discoverAdditionalUrls(url, $)
            : [];

        if (additionalUrls.length > 0) {
            const pageResults = await fetchPagesParallel(additionalUrls, PER_PAGE_TIMEOUT);

            for (const pr of pageResults) {
                if (!pr.html) continue;
                const $p = cheerio.load(pr.html);
                const pRaw = extractBodyText($p);
                const pExtract = extractProductsAndOffers($p);
                const pQuals = extractQualifications(pRaw);

                rawText += '\n\n' + pRaw;
                products = mergeDedup(products, pExtract.products);
                offers = mergeDedup(offers, pExtract.offers);
                qualifications = mergeDedup(qualifications, pQuals);
            }
        }

        // Re-infer industry from merged rawText
        const industry = inferIndustry(rawText, companyName);

        return {
            companyName: sanitizeTextField(companyName, 500),
            industry: industry ? sanitizeTextField(industry, 200) : null,
            products: sanitizeStringArray(products, 8, 200),
            offers: sanitizeStringArray(offers, 5, 200),
            qualifications: sanitizeStringArray(qualifications, 5, 200),
            logoUrl: sanitizeScrapedUrl(logoUrl),
            primaryColor: primaryColor ? sanitizeTextField(primaryColor, 20) : null,
            secondaryColor: secondaryColor ? sanitizeTextField(secondaryColor, 20) : null,
            websiteUrl: url,
            description: metaDescription || h1
                ? sanitizeScrapedText(metaDescription || h1, 500)
                : null,
            rawText: sanitizeScrapedText(rawText, 8000),
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

/** Merge arrays, deduplicating by normalized key */
function mergeDedup(a: string[], b: string[]): string[] {
    const seen = new Set(a.map((s) => s.trim().toLowerCase().slice(0, 80)));
    for (const s of b) {
        const key = s.trim().toLowerCase().slice(0, 80);
        if (key && !seen.has(key)) {
            seen.add(key);
            a.push(s.trim());
        }
    }
    return a;
}

/** Discover up to (MAX_PAGES - 1) additional URLs from sitemap or nav links */
async function discoverAdditionalUrls(baseUrl: string, $: cheerio.CheerioAPI): Promise<string[]> {
    const base = new URL(baseUrl);
    const origin = base.origin;
    const homeNorm = base.href.replace(/\/$/, '') || base.href;

    const sameOrigin = (u: string): boolean => {
        try {
            const parsed = new URL(u, baseUrl);
            return parsed.origin === origin;
        } catch {
            return false;
        }
    };

    const excludeHome = (u: string): boolean => {
        const norm = u.replace(/\/$/, '');
        return norm !== homeNorm && norm !== baseUrl.replace(/\/$/, '');
    };

    // 1. Try sitemap
    const sitemapUrls = await fetchSitemapUrls(baseUrl);
    const fromSitemap = sitemapUrls
        .filter((u) => sameOrigin(u) && excludeHome(u))
        .slice(0, MAX_PAGES - 1);

    if (fromSitemap.length > 0) return fromSitemap;

    // 2. Fallback: nav links from homepage
    const seen = new Set<string>();
    const navUrls: string[] = [];
    $('nav a, header a, .nav a, .header a, [role="navigation"] a').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        try {
            const absolute = new URL(href, baseUrl).href;
            const norm = absolute.replace(/\/$/, '');
            if (sameOrigin(absolute) && excludeHome(absolute) && !seen.has(norm)) {
                seen.add(norm);
                navUrls.push(absolute);
            }
        } catch {
            // ignore invalid URLs
        }
    });

    return navUrls.slice(0, MAX_PAGES - 1);
}

/** Fetch sitemap and parse <loc> URLs. Handles sitemap index (nested). */
async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
    const base = new URL(baseUrl);
    const candidates = [
        new URL('/sitemap.xml', base).href,
        new URL('/sitemap_index.xml', base).href,
        new URL('/sitemap-index.xml', base).href,
        new URL('/sitemap.xml', base.origin).href,
    ];

    for (const url of candidates) {
        try {
            const res = await fetch(url, {
                headers: FETCH_HEADERS,
                signal: AbortSignal.timeout(3000),
            });
            if (!res.ok) continue;

            const xml = await res.text();
            const locs = xml.match(/<loc>([^<]+)<\/loc>/gi);
            if (!locs || locs.length === 0) continue;

            const urls = locs.map((m) => m.replace(/<\/?loc>/gi, '').trim());
            const xmlUrls = urls.filter((u) => u.toLowerCase().endsWith('.xml'));

            if (xmlUrls.length > 0) {
                // Sitemap index: fetch first child sitemap
                const childRes = await fetch(xmlUrls[0], {
                    headers: FETCH_HEADERS,
                    signal: AbortSignal.timeout(3000),
                });
                if (!childRes.ok) return urls.filter((u) => !u.toLowerCase().endsWith('.xml'));
                const childXml = await childRes.text();
                const childLocs = childXml.match(/<loc>([^<]+)<\/loc>/gi);
                if (childLocs) {
                    return childLocs.map((m) => m.replace(/<\/?loc>/gi, '').trim());
                }
            }

            return urls;
        } catch {
            continue;
        }
    }

    return [];
}

/** Fetch multiple pages in parallel. Returns { url, html } for each; html may be empty on failure */
async function fetchPagesParallel(urls: string[], perPageTimeout: number): Promise<{ url: string; html: string }[]> {
    const results = await Promise.allSettled(
        urls.map(async (url) => {
            const res = await fetch(url, {
                headers: FETCH_HEADERS,
                signal: AbortSignal.timeout(perPageTimeout),
            });
            if (!res.ok) return { url, html: '' };
            const html = await res.text();
            return { url, html };
        })
    );

    return results.map((r) =>
        r.status === 'fulfilled' ? r.value : { url: '', html: '' }
    ).filter((p) => p.html.length > 0);
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
