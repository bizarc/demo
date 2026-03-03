/**
 * RADAR — Google Places integration for business discovery.
 * Falls back to Perplexity AI via OpenRouter when Places API unavailable.
 */

import { getOpenRouterClient } from './openrouter';

export interface PlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    phone: string | null;
    website: string | null;
    rating: number | null;
    review_count: number | null;
    city: string | null;
    state: string | null;
}

// ─── Google Places Text Search ────────────────────────────────────────────────

/**
 * Search Google Places Text Search API for businesses.
 * Returns basic results (no phone/website — those require getPlaceDetails).
 */
export async function searchPlaces(query: string, apiKey: string): Promise<PlaceResult[]> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('type', 'establishment');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`Google Places API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API status: ${data.status} — ${data.error_message || ''}`);
    }

    const results: PlaceResult[] = (data.results || []).map((r: any) => {
        const { city, state } = parseAddressComponents(r.address_components || []);
        return {
            place_id: r.place_id,
            name: r.name,
            formatted_address: r.formatted_address || '',
            phone: null, // Not returned by Text Search; fetch via getPlaceDetails
            website: null,
            rating: r.rating ?? null,
            review_count: r.user_ratings_total ?? null,
            city,
            state,
        };
    });

    return results;
}

/**
 * Fetch phone + website for a single place using the Place Details API.
 */
export async function getPlaceDetails(
    placeId: string,
    apiKey: string
): Promise<{ phone: string | null; website: string | null }> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'formatted_phone_number,website');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return { phone: null, website: null };

    const data = await res.json();
    const result = data.result || {};
    return {
        phone: result.formatted_phone_number || null,
        website: result.website || null,
    };
}

/**
 * Enrich a list of places with phone + website in parallel batches.
 * Fetches at most `limit` details to avoid excessive API spend.
 */
export async function enrichPlacesWithDetails(
    places: PlaceResult[],
    apiKey: string,
    limit = 20
): Promise<PlaceResult[]> {
    const toEnrich = places.slice(0, limit);
    const enriched = await Promise.allSettled(
        toEnrich.map(async (place) => {
            const details = await getPlaceDetails(place.place_id, apiKey);
            return { ...place, ...details };
        })
    );

    return enriched.map((r, i) =>
        r.status === 'fulfilled' ? r.value : toEnrich[i]
    );
}

// ─── Perplexity AI fallback ───────────────────────────────────────────────────

/**
 * Used when Google Places API key is absent or returns zero results.
 * Asks Perplexity to generate a structured list of businesses.
 */
export async function searchPlacesAI(query: string): Promise<PlaceResult[]> {
    const client = getOpenRouterClient();

    const prompt = `Find real businesses matching: "${query}"

Return a JSON array of up to 15 businesses. Each object must have these exact fields:
{
  "name": "Business Name",
  "formatted_address": "123 Main St, City, State ZIP",
  "phone": "+1 (555) 123-4567 or null",
  "website": "https://example.com or null",
  "rating": 4.5 or null,
  "review_count": 120 or null,
  "city": "Austin",
  "state": "TX"
}

Return ONLY the JSON array, no explanation. Use real businesses if known, otherwise return empty array [].`;

    const raw = await client.chat(
        [{ role: 'user', content: prompt }],
        'perplexity/sonar',
        { maxTokens: 2048, temperature: 0.2 }
    );

    try {
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];
        const parsed: any[] = JSON.parse(jsonMatch[0]);
        return parsed
            .filter((r) => r && typeof r.name === 'string')
            .map((r, i) => ({
                place_id: `ai_${i}_${Date.now()}`,
                name: String(r.name || ''),
                formatted_address: String(r.formatted_address || ''),
                phone: r.phone || null,
                website: r.website || null,
                rating: typeof r.rating === 'number' ? r.rating : null,
                review_count: typeof r.review_count === 'number' ? r.review_count : null,
                city: r.city || null,
                state: r.state || null,
            }));
    } catch {
        return [];
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAddressComponents(
    components: Array<{ types: string[]; short_name: string; long_name: string }>
): { city: string | null; state: string | null } {
    let city: string | null = null;
    let state: string | null = null;

    for (const c of components) {
        if (c.types.includes('locality')) city = c.long_name;
        if (c.types.includes('administrative_area_level_1')) state = c.short_name;
    }

    return { city, state };
}
