import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    searchPlaces,
    getPlaceDetails,
    enrichPlacesWithDetails,
    searchPlacesAI,
    type PlaceResult,
} from '../radarPlaces';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../openrouter', () => ({
    getOpenRouterClient: vi.fn(() => ({
        chat: vi.fn(),
    })),
}));

const TEST_API_KEY = 'test-google-api-key';

const googleTextSearchResponse = {
    status: 'OK',
    results: [
        {
            place_id: 'ChIJ_001',
            name: 'Acme Roofing',
            formatted_address: '123 Main St, Austin, TX 78701, USA',
            rating: 4.5,
            user_ratings_total: 42,
            address_components: [
                { types: ['locality'], long_name: 'Austin', short_name: 'Austin' },
                { types: ['administrative_area_level_1'], long_name: 'Texas', short_name: 'TX' },
            ],
        },
        {
            place_id: 'ChIJ_002',
            name: 'Best Roofers',
            formatted_address: '456 Oak Ave, Austin, TX 78702, USA',
            rating: 4.0,
            user_ratings_total: 18,
            address_components: [
                { types: ['locality'], long_name: 'Austin', short_name: 'Austin' },
                { types: ['administrative_area_level_1'], long_name: 'Texas', short_name: 'TX' },
            ],
        },
    ],
};

const googleDetailsResponse = {
    result: {
        formatted_phone_number: '(512) 555-1234',
        website: 'https://acmeroof.com',
    },
};

// ─── searchPlaces ─────────────────────────────────────────────────────────────

describe('searchPlaces', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('returns mapped PlaceResult array on success', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => googleTextSearchResponse,
        } as Response);

        const results = await searchPlaces('Roofers in Austin TX', TEST_API_KEY);

        expect(results).toHaveLength(2);
        expect(results[0].place_id).toBe('ChIJ_001');
        expect(results[0].name).toBe('Acme Roofing');
        expect(results[0].rating).toBe(4.5);
        expect(results[0].review_count).toBe(42);
        expect(results[0].city).toBe('Austin');
        expect(results[0].state).toBe('TX');
        expect(results[0].phone).toBeNull(); // not returned by text search
        expect(results[0].website).toBeNull();
    });

    it('returns empty array for ZERO_RESULTS status', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
        } as Response);

        const results = await searchPlaces('nonexistent query xyz', TEST_API_KEY);
        expect(results).toHaveLength(0);
    });

    it('throws on non-OK HTTP response', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
        } as Response);

        await expect(searchPlaces('query', TEST_API_KEY)).rejects.toThrow('Google Places API error: 403');
    });

    it('throws on API error status (e.g. REQUEST_DENIED)', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'REQUEST_DENIED',
                error_message: 'API key invalid',
            }),
        } as Response);

        await expect(searchPlaces('query', TEST_API_KEY)).rejects.toThrow('REQUEST_DENIED');
    });

    it('includes query and key in the fetch URL', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
        } as Response);

        await searchPlaces('Dentists Chicago', TEST_API_KEY);

        const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
        expect(calledUrl).toContain('Dentists+Chicago');
        expect(calledUrl).toContain(TEST_API_KEY);
        expect(calledUrl).toContain('textsearch');
    });

    it('handles missing address_components gracefully', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'OK',
                results: [{
                    place_id: 'ChIJ_noaddr',
                    name: 'Mystery Co',
                    formatted_address: 'Unknown',
                    // no address_components
                }],
            }),
        } as Response);

        const results = await searchPlaces('query', TEST_API_KEY);
        expect(results[0].city).toBeNull();
        expect(results[0].state).toBeNull();
    });
});

// ─── getPlaceDetails ──────────────────────────────────────────────────────────

describe('getPlaceDetails', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('returns phone and website on success', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => googleDetailsResponse,
        } as Response);

        const details = await getPlaceDetails('ChIJ_001', TEST_API_KEY);
        expect(details.phone).toBe('(512) 555-1234');
        expect(details.website).toBe('https://acmeroof.com');
    });

    it('returns nulls on non-OK response (graceful)', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);

        const details = await getPlaceDetails('ChIJ_001', TEST_API_KEY);
        expect(details.phone).toBeNull();
        expect(details.website).toBeNull();
    });

    it('returns nulls when result fields are absent', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: {} }),
        } as Response);

        const details = await getPlaceDetails('ChIJ_001', TEST_API_KEY);
        expect(details.phone).toBeNull();
        expect(details.website).toBeNull();
    });
});

// ─── enrichPlacesWithDetails ──────────────────────────────────────────────────

describe('enrichPlacesWithDetails', () => {
    const rawPlaces: PlaceResult[] = [
        { place_id: 'ChIJ_001', name: 'Acme Roofing', formatted_address: '123 Main St', phone: null, website: null, rating: 4.5, review_count: 42, city: 'Austin', state: 'TX' },
        { place_id: 'ChIJ_002', name: 'Best Roofers', formatted_address: '456 Oak Ave', phone: null, website: null, rating: 4.0, review_count: 18, city: 'Austin', state: 'TX' },
    ];

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('enriches places with phone and website', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ result: { formatted_phone_number: '(512) 111-1111', website: 'https://a.com' } }) } as Response)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ result: { formatted_phone_number: '(512) 222-2222', website: 'https://b.com' } }) } as Response);

        const enriched = await enrichPlacesWithDetails(rawPlaces, TEST_API_KEY);

        expect(enriched).toHaveLength(2);
        expect(enriched[0].phone).toBe('(512) 111-1111');
        expect(enriched[0].website).toBe('https://a.com');
        expect(enriched[1].phone).toBe('(512) 222-2222');
    });

    it('respects the limit parameter', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ result: {} }) } as Response);

        await enrichPlacesWithDetails(rawPlaces, TEST_API_KEY, 1);
        // Only 1 detail call should have been made
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    it('falls back to original place data when detail fetch fails', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);

        const enriched = await enrichPlacesWithDetails(rawPlaces, TEST_API_KEY);

        // Falls back to originals — phone and website remain null
        expect(enriched[0].phone).toBeNull();
        expect(enriched[0].website).toBeNull();
        expect(enriched[0].name).toBe('Acme Roofing'); // other fields preserved
    });
});

// ─── searchPlacesAI ───────────────────────────────────────────────────────────

describe('searchPlacesAI', () => {
    it('parses a valid JSON array from AI response', async () => {
        const { getOpenRouterClient } = await import('../openrouter');
        vi.mocked(getOpenRouterClient).mockReturnValue({
            chat: vi.fn().mockResolvedValue(`[
                {"name":"Acme Roofing","formatted_address":"123 Main St, Austin, TX","phone":"(512) 555-1234","website":"https://acme.com","rating":4.5,"review_count":42,"city":"Austin","state":"TX"}
            ]`),
        } as ReturnType<typeof getOpenRouterClient>);

        const results = await searchPlacesAI('Roofers in Austin TX');

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Acme Roofing');
        expect(results[0].city).toBe('Austin');
        expect(results[0].state).toBe('TX');
        expect(results[0].place_id).toMatch(/^ai_0_/);
    });

    it('assigns ai_ prefixed place_id to each result', async () => {
        const { getOpenRouterClient } = await import('../openrouter');
        vi.mocked(getOpenRouterClient).mockReturnValue({
            chat: vi.fn().mockResolvedValue(`[
                {"name":"A","formatted_address":"","phone":null,"website":null,"rating":null,"review_count":null,"city":"Austin","state":"TX"},
                {"name":"B","formatted_address":"","phone":null,"website":null,"rating":null,"review_count":null,"city":"Dallas","state":"TX"}
            ]`),
        } as ReturnType<typeof getOpenRouterClient>);

        const results = await searchPlacesAI('HVAC Texas');
        expect(results[0].place_id).toMatch(/^ai_0_/);
        expect(results[1].place_id).toMatch(/^ai_1_/);
    });

    it('returns empty array when AI returns no JSON array', async () => {
        const { getOpenRouterClient } = await import('../openrouter');
        vi.mocked(getOpenRouterClient).mockReturnValue({
            chat: vi.fn().mockResolvedValue('I cannot find any businesses matching that query.'),
        } as ReturnType<typeof getOpenRouterClient>);

        const results = await searchPlacesAI('nothing');
        expect(results).toEqual([]);
    });

    it('returns empty array when AI returns empty JSON array', async () => {
        const { getOpenRouterClient } = await import('../openrouter');
        vi.mocked(getOpenRouterClient).mockReturnValue({
            chat: vi.fn().mockResolvedValue('[]'),
        } as ReturnType<typeof getOpenRouterClient>);

        const results = await searchPlacesAI('very obscure query');
        expect(results).toEqual([]);
    });

    it('filters out entries without a name', async () => {
        const { getOpenRouterClient } = await import('../openrouter');
        vi.mocked(getOpenRouterClient).mockReturnValue({
            chat: vi.fn().mockResolvedValue(`[
                {"name":"Valid Co","formatted_address":"123 St","phone":null,"website":null,"rating":null,"review_count":null,"city":"X","state":"Y"},
                {"formatted_address":"no name entry","phone":null,"website":null}
            ]`),
        } as ReturnType<typeof getOpenRouterClient>);

        const results = await searchPlacesAI('query');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Valid Co');
    });

    it('returns empty array on malformed JSON', async () => {
        const { getOpenRouterClient } = await import('../openrouter');
        vi.mocked(getOpenRouterClient).mockReturnValue({
            chat: vi.fn().mockResolvedValue('[{broken json'),
        } as ReturnType<typeof getOpenRouterClient>);

        const results = await searchPlacesAI('query');
        expect(results).toEqual([]);
    });

    it('casts rating to null when not a number', async () => {
        const { getOpenRouterClient } = await import('../openrouter');
        vi.mocked(getOpenRouterClient).mockReturnValue({
            chat: vi.fn().mockResolvedValue(`[
                {"name":"Co","formatted_address":"","phone":null,"website":null,"rating":"not-a-number","review_count":null,"city":"A","state":"B"}
            ]`),
        } as ReturnType<typeof getOpenRouterClient>);

        const results = await searchPlacesAI('query');
        expect(results[0].rating).toBeNull();
    });
});
