import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../demo/route';
import { createMockRequest } from './helpers';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => ({
        from: mockFrom,
    })),
}));

function chainMock(...fns: Array<() => unknown>) {
    return fns.reduce((acc, fn) => {
        const result = fn();
        return typeof result === 'object' && result !== null && 'then' in result
            ? result
            : { ...acc, ...(result as object) };
    }, {});
}

describe('POST /api/demo', () => {
    const baseUrl = 'http://localhost/api/demo';

    beforeEach(() => {
        vi.clearAllMocks();

        mockFrom.mockReturnValue({
            insert: mockInsert,
        });
        mockInsert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { id: 'test-demo-uuid' },
                    error: null,
                }),
            }),
        });
    });

    it('creates draft with minimal data', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: {
                status: 'draft',
                created_by: 'creator-123',
            },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.id).toBe('test-demo-uuid');
        expect(data.status).toBe('draft');
        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'draft',
                created_by: 'creator-123',
            })
        );
    });

    it('returns 400 for active demo without required fields', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: {
                status: 'active',
                company_name: 'Acme',
                // missing mission_profile
            },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('mission_profile and company_name are required');
    });

    it('returns 400 for invalid mission_profile', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: {
                status: 'active',
                company_name: 'Acme',
                mission_profile: 'invalid-profile',
            },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Invalid mission_profile');
    });

    it('creates active demo with required fields', async () => {
        mockInsert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { id: 'active-demo-uuid' },
                    error: null,
                }),
            }),
        });

        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: {
                status: 'active',
                company_name: 'Acme Corp',
                mission_profile: 'database-reactivation',
                industry: 'Technology',
            },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.id).toBe('active-demo-uuid');
        expect(data.expires_at).toBeDefined();
        expect(data.magic_link).toContain('/demo/active-demo-uuid');
    });
});

describe('GET /api/demo', () => {
    const baseUrl = 'http://localhost/api/demo';

    beforeEach(() => {
        vi.clearAllMocks();

        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 'demo-1',
                        company_name: 'Acme',
                        status: 'active',
                        mission_profile: 'reactivation',
                    },
                ],
                error: null,
            }),
        });
    });

    it('returns 400 when created_by is missing', async () => {
        const req = createMockRequest('http://localhost/api/demo');

        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('created_by is required');
    });

    it('returns demos for valid created_by', async () => {
        const req = createMockRequest('http://localhost/api/demo?created_by=creator-123');

        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.demos).toBeDefined();
        expect(Array.isArray(data.demos)).toBe(true);
    });
});
