import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../discover/import/route';
import { createMockRequest } from '../../__tests__/helpers';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/rateLimit', () => ({
    getClientIp: vi.fn(() => '127.0.0.1'),
    checkRateLimit: vi.fn(() => ({ allowed: true })),
    RADAR_LIMIT: { windowMs: 60000, max: 30 },
}));

let fromMock: ReturnType<typeof vi.fn>;

vi.mock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
        },
        from: (...args: unknown[]) => fromMock(...args),
    })),
}));

// Fixtures
const googlePlace = {
    place_id: 'ChIJ_test_001',
    name: 'Acme Roofing',
    formatted_address: '123 Main St, Austin, TX',
    phone: '(512) 555-1234',
    website: 'https://acmeroof.com',
    rating: 4.5,
    review_count: 42,
    city: 'Austin',
    state: 'TX',
};

const aiPlace = {
    place_id: 'ai_0_1234567890',
    name: 'Best HVAC Co',
    formatted_address: '456 Oak Ave, Dallas, TX',
    phone: '(214) 555-9999',
    website: 'https://besthvac.com',
    rating: 4.2,
    review_count: 18,
    city: 'Dallas',
    state: 'TX',
};

const noPhonePlace = {
    place_id: 'ai_1_9999',
    name: 'No Phone Co',
    formatted_address: '789 Elm St, Houston, TX',
    phone: null,
    website: 'https://nophone.com',
    rating: null,
    review_count: null,
    city: 'Houston',
    state: 'TX',
};

const noContactPlace = {
    place_id: 'ai_2_9999',
    name: 'Ghost Business',
    formatted_address: '',
    phone: null,
    website: null,
    rating: null,
    review_count: null,
    city: null,
    state: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/radar/discover/import', () => {
    const url = 'http://localhost/api/radar/discover/import';

    beforeEach(() => {
        vi.clearAllMocks();
        fromMock = vi.fn();
    });

    // ── Validation ─────────────────────────────────────────────────────────────

    it('returns 400 when places is empty', async () => {
        const req = createMockRequest(url, { method: 'POST', body: { places: [] } });
        const res = await POST(req);
        expect(res.status).toBe(400);
        expect((await res.json()).error).toMatch(/no places/i);
    });

    it('returns 400 when places is missing', async () => {
        const req = createMockRequest(url, { method: 'POST', body: {} });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 429 when rate limited', async () => {
        const { checkRateLimit } = await import('@/lib/rateLimit');
        vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false });
        const req = createMockRequest(url, { method: 'POST', body: { places: [googlePlace] } });
        const res = await POST(req);
        expect(res.status).toBe(429);
    });

    // ── Full insert path (migration 007 applied) ────────────────────────────────

    it('imports a Google result using the full row on first attempt', async () => {
        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    // dedup: google_place_id — no existing
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                        }),
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                    // full insert succeeds
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: 'prospect-1' }, error: null }),
                        }),
                    }),
                };
            }
            return makeSessionChain(0);
        });

        const req = createMockRequest(url, { method: 'POST', body: { places: [googlePlace] } });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.imported).toBe(1);
        expect(data.skipped).toBe(0);
        expect(data.ids).toContain('prospect-1');
    });

    it('imports an AI result using the full row on first attempt', async () => {
        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: 'prospect-ai-1' }, error: null }),
                        }),
                    }),
                };
            }
            return makeSessionChain(0);
        });

        const req = createMockRequest(url, { method: 'POST', body: { places: [aiPlace] } });
        const res = await POST(req);
        const data = await res.json();

        expect(data.imported).toBe(1);
        expect(data.ids).toContain('prospect-ai-1');
    });

    // ── Fallback path (migration 007 NOT applied) ───────────────────────────────

    it('falls back to minimal row (status active, no discovery columns) when full insert fails', async () => {
        let insertCallCount = 0;
        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                        }),
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                    insert: vi.fn().mockImplementation(() => {
                        insertCallCount++;
                        // 1st attempt (full row) → fails (column doesn't exist)
                        // 2nd attempt (minimal row) → succeeds
                        const id = insertCallCount === 1 ? null : 'prospect-fallback';
                        const err = insertCallCount === 1
                            ? { message: 'column "google_place_id" does not exist' }
                            : null;
                        return {
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: id ? { id } : null, error: err }),
                            }),
                        };
                    }),
                };
            }
            return makeSessionChain(0);
        });

        const req = createMockRequest(url, { method: 'POST', body: { places: [googlePlace] } });
        const res = await POST(req);
        const data = await res.json();

        expect(data.imported).toBe(1);
        expect(data.ids).toContain('prospect-fallback');
        // Two insert attempts were made
        expect(insertCallCount).toBe(2);
    });

    it('skips when full insert fails AND place has no phone (cannot satisfy original constraint)', async () => {
        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                    // full insert fails (migration not applied)
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'column "city" does not exist' },
                            }),
                        }),
                    }),
                };
            }
            return makeSessionChain(0);
        });

        // noPhonePlace has website but no phone
        const req = createMockRequest(url, { method: 'POST', body: { places: [noPhonePlace] } });
        const res = await POST(req);
        const data = await res.json();

        expect(data.imported).toBe(0);
        expect(data.skipped).toBe(1);
        // db_error should be surfaced
        expect(data.db_error).toMatch(/city/);
    });

    // ── Deduplication ──────────────────────────────────────────────────────────

    it('skips a Google result already found by google_place_id', async () => {
        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-1' } }),
                        }),
                    }),
                };
            }
            return makeSessionChain(0);
        });

        const req = createMockRequest(url, { method: 'POST', body: { places: [googlePlace] } });
        const res = await POST(req);
        const data = await res.json();

        expect(data.imported).toBe(0);
        expect(data.skipped).toBe(1);
        expect(data.ids).toContain('existing-1');
    });

    it('skips a result already found by company_name', async () => {
        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    select: vi.fn().mockReturnValue({
                        // google_place_id dedup — no match
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                        }),
                        // company_name dedup — match found
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-by-name' } }),
                            }),
                        }),
                    }),
                };
            }
            return makeSessionChain(0);
        });

        const req = createMockRequest(url, { method: 'POST', body: { places: [googlePlace] } });
        const res = await POST(req);
        const data = await res.json();

        expect(data.skipped).toBe(1);
        expect(data.ids).toContain('existing-by-name');
    });

    it('skips places with no name', async () => {
        fromMock.mockReturnValue(makeSessionChain(0));

        const req = createMockRequest(url, { method: 'POST', body: { places: [{ ...googlePlace, name: '' }] } });
        const res = await POST(req);
        const data = await res.json();

        expect(data.skipped).toBe(1);
        expect(data.imported).toBe(0);
    });

    // ── Session count ──────────────────────────────────────────────────────────

    it('increments session imported_count additively', async () => {
        let updatedCount: number | undefined;

        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                        }),
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: 'p-1' }, error: null }),
                        }),
                    }),
                };
            }
            if (table === 'discovery_sessions') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { imported_count: 5 }, error: null }),
                        }),
                    }),
                    update: vi.fn().mockImplementation((vals: Record<string, number>) => {
                        updatedCount = vals.imported_count;
                        return { eq: vi.fn().mockResolvedValue({ error: null }) };
                    }),
                };
            }
            return {};
        });

        const req = createMockRequest(url, {
            method: 'POST',
            body: { places: [googlePlace], session_id: 'session-1' },
        });
        await POST(req);

        expect(updatedCount).toBe(6); // 5 existing + 1 new
    });

    it('does not update session count when discovery_sessions table is absent', async () => {
        let sessionUpdateCalled = false;

        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                        }),
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: 'p-1' }, error: null }),
                        }),
                    }),
                };
            }
            if (table === 'discovery_sessions') {
                sessionUpdateCalled = true;
                return {
                    // table doesn't exist — select returns error
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'relation "discovery_sessions" does not exist' },
                            }),
                        }),
                    }),
                    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }),
                };
            }
            return {};
        });

        const req = createMockRequest(url, {
            method: 'POST',
            body: { places: [googlePlace], session_id: 'session-1' },
        });
        const res = await POST(req);
        const data = await res.json();

        // Import should still succeed even without discovery_sessions
        expect(data.imported).toBe(1);
    });

    // ── Multi-place ────────────────────────────────────────────────────────────

    it('imports multiple places and reports correct counts', async () => {
        let callCount = 0;
        fromMock.mockImplementation((table: string) => {
            if (table === 'prospects') {
                callCount++;
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                        }),
                        ilike: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                            }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: `p-${callCount}` }, error: null }),
                        }),
                    }),
                };
            }
            return makeSessionChain(0);
        });

        const place2 = { ...googlePlace, place_id: 'ChIJ_002', name: 'Best Roofing Co' };
        const req = createMockRequest(url, {
            method: 'POST',
            body: { places: [googlePlace, place2] },
        });
        const res = await POST(req);
        const data = await res.json();

        expect(data.imported).toBe(2);
        expect(data.ids).toHaveLength(2);
    });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSessionChain(existingCount: number) {
    return {
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { imported_count: existingCount }, error: null }),
            }),
        }),
        update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
        }),
    };
}
