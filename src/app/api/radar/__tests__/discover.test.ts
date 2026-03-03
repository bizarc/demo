import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../discover/route';
import { createMockRequest } from '../../__tests__/helpers';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockSupabaseClient = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn(() => ({
        insert: mockInsert.mockReturnThis(),
        select: mockSelect.mockReturnThis(),
        single: mockSingle,
    })),
};

vi.mock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/lib/rateLimit', () => ({
    getClientIp: vi.fn(() => '127.0.0.1'),
    checkRateLimit: vi.fn(() => ({ allowed: true })),
    RADAR_LIMIT: { windowMs: 60000, max: 30 },
}));

const mockSearchPlaces = vi.fn();
const mockEnrichPlacesWithDetails = vi.fn();
const mockSearchPlacesAI = vi.fn();

vi.mock('@/lib/radarPlaces', () => ({
    searchPlaces: (...args: unknown[]) => mockSearchPlaces(...args),
    enrichPlacesWithDetails: (...args: unknown[]) => mockEnrichPlacesWithDetails(...args),
    searchPlacesAI: (...args: unknown[]) => mockSearchPlacesAI(...args),
}));

const samplePlace = {
    place_id: 'ChIJ_test_001',
    name: 'Acme Roofing',
    formatted_address: '123 Main St, Austin, TX 78701',
    phone: '(512) 555-1234',
    website: 'https://acmeroof.com',
    rating: 4.5,
    review_count: 42,
    city: 'Austin',
    state: 'TX',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/radar/discover', () => {
    const url = 'http://localhost/api/radar/discover';

    beforeEach(() => {
        vi.clearAllMocks();
        // Default: no Google API key → AI fallback
        delete process.env.GOOGLE_PLACES_API_KEY;
        mockSearchPlacesAI.mockResolvedValue([samplePlace]);
        mockSingle.mockResolvedValue({ data: { id: 'session-uuid-1' }, error: null });
        mockInsert.mockReturnValue({
            select: mockSelect.mockReturnValue({
                single: mockSingle,
            }),
        });
        mockSupabaseClient.from.mockReturnValue({
            insert: mockInsert.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'session-uuid-1' }, error: null }),
                }),
            }),
        });
    });

    it('returns 400 when no query provided', async () => {
        const req = createMockRequest(url, { method: 'POST', body: {} });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toMatch(/query|niche/i);
    });

    it('returns 400 when only whitespace query', async () => {
        const req = createMockRequest(url, { method: 'POST', body: { query: '   ' } });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('uses AI fallback when no Google API key and returns results', async () => {
        mockSearchPlacesAI.mockResolvedValue([samplePlace]);

        const req = createMockRequest(url, {
            method: 'POST',
            body: { niche: 'Roofers', location: 'Austin TX' },
        });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.source).toBe('ai');
        expect(data.results).toHaveLength(1);
        expect(data.results[0].name).toBe('Acme Roofing');
        expect(mockSearchPlacesAI).toHaveBeenCalledWith('Roofers in Austin TX');
    });

    it('uses Google Places when API key is set', async () => {
        process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
        mockSearchPlaces.mockResolvedValue([samplePlace]);
        mockEnrichPlacesWithDetails.mockResolvedValue([samplePlace]);

        const req = createMockRequest(url, {
            method: 'POST',
            body: { query: 'Dentists in Chicago IL' },
        });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.source).toBe('google_places');
        expect(mockSearchPlaces).toHaveBeenCalledWith('Dentists in Chicago IL', 'test-api-key');
    });

    it('falls back to AI when Google Places throws', async () => {
        process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
        mockSearchPlaces.mockRejectedValue(new Error('Google API error'));
        mockSearchPlacesAI.mockResolvedValue([samplePlace]);

        const req = createMockRequest(url, {
            method: 'POST',
            body: { query: 'HVAC Austin TX' },
        });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(mockSearchPlacesAI).toHaveBeenCalled();
    });

    it('returns 429 when rate limited', async () => {
        const { checkRateLimit } = await import('@/lib/rateLimit');
        vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false });

        const req = createMockRequest(url, { method: 'POST', body: { query: 'Roofers' } });
        const res = await POST(req);
        expect(res.status).toBe(429);
    });

    it('builds finalQuery from niche + location', async () => {
        mockSearchPlacesAI.mockResolvedValue([]);

        const req = createMockRequest(url, {
            method: 'POST',
            body: { niche: 'Plumbers', location: 'Dallas TX' },
        });
        await POST(req);
        expect(mockSearchPlacesAI).toHaveBeenCalledWith('Plumbers in Dallas TX');
    });

    it('uses free-form query when provided', async () => {
        mockSearchPlacesAI.mockResolvedValue([]);

        const req = createMockRequest(url, {
            method: 'POST',
            body: { query: 'HVAC near me' },
        });
        await POST(req);
        expect(mockSearchPlacesAI).toHaveBeenCalledWith('HVAC near me');
    });

    it('includes session_id in response when session saved', async () => {
        mockSearchPlacesAI.mockResolvedValue([samplePlace]);
        mockSupabaseClient.from.mockReturnValue({
            insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'new-session-id' }, error: null }),
                }),
            }),
        });

        const req = createMockRequest(url, { method: 'POST', body: { query: 'Roofers Austin' } });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.session_id).toBe('new-session-id');
    });

    it('returns session_id null when session insert fails (graceful)', async () => {
        mockSearchPlacesAI.mockResolvedValue([samplePlace]);
        mockSupabaseClient.from.mockReturnValue({
            insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
                }),
            }),
        });

        const req = createMockRequest(url, { method: 'POST', body: { query: 'Roofers Austin' } });
        const res = await POST(req);
        const data = await res.json();

        // Should still return 200 with results even if session insert fails
        expect(res.status).toBe(200);
        expect(data.session_id).toBeNull();
        expect(data.results).toHaveLength(1);
    });
});
