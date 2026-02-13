import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../demo/[id]/route';
import { createMockRequest } from './helpers';

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => ({
        from: mockFrom,
    })),
}));

describe('GET /api/demo/[id]', () => {
    const demoId = 'existing-demo-uuid';

    beforeEach(() => {
        vi.clearAllMocks();

        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: {
                    id: demoId,
                    status: 'active',
                    expires_at: new Date(Date.now() + 86400000).toISOString(),
                    company_name: 'Acme',
                },
                error: null,
            }),
        });
    });

    it('returns 400 when id is missing', async () => {
        const req = createMockRequest('http://localhost/api/demo/');
        const res = await GET(req, { params: Promise.resolve({ id: '' }) });
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toContain('Demo ID is required');
    });

    it('returns demo when found and not expired', async () => {
        const req = createMockRequest(`http://localhost/api/demo/${demoId}`);
        const res = await GET(req, { params: Promise.resolve({ id: demoId }) });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.id).toBe(demoId);
        expect(data.company_name).toBe('Acme');
    });

    it('returns 404 when demo not found', async () => {
        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        });

        const req = createMockRequest('http://localhost/api/demo/non-existent');
        const res = await GET(req, { params: Promise.resolve({ id: 'non-existent' }) });
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.error).toBe('Demo not found');
    });

    it('returns 410 when demo is expired', async () => {
        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: {
                    id: demoId,
                    status: 'active',
                    expires_at: new Date(Date.now() - 86400000).toISOString(),
                    company_name: 'Acme',
                },
                error: null,
            }),
        });

        const req = createMockRequest(`http://localhost/api/demo/${demoId}`);
        const res = await GET(req, { params: Promise.resolve({ id: demoId }) });
        const data = await res.json();

        expect(res.status).toBe(410);
        expect(data.error).toContain('expired');
        expect(data.expired).toBe(true);
    });
});

describe('PATCH /api/demo/[id]', () => {
    const demoId = 'draft-demo-uuid';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 when id is missing', async () => {
        const req = createMockRequest('http://localhost/api/demo/', {
            method: 'PATCH',
            body: { company_name: 'Updated' },
        });
        const res = await PATCH(req, { params: Promise.resolve({ id: '' }) });
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toContain('Demo ID is required');
    });

    it('updates draft with partial data', async () => {
        const fetchExistingChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { id: demoId, status: 'draft' },
                error: null,
            }),
        };

        const updateChain = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { id: demoId, status: 'draft', updated_at: new Date().toISOString() },
                error: null,
            }),
        };

        mockFrom
            .mockReturnValueOnce(fetchExistingChain)
            .mockReturnValueOnce(updateChain);

        const req = createMockRequest(`http://localhost/api/demo/${demoId}`, {
            method: 'PATCH',
            body: { company_name: 'Updated Name' },
        });

        const res = await PATCH(req, { params: Promise.resolve({ id: demoId }) });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.id).toBe(demoId);
    });
});

describe('DELETE /api/demo/[id]', () => {
    const demoId = 'demo-to-delete';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 when id is missing', async () => {
        const req = createMockRequest('http://localhost/api/demo/', { method: 'DELETE' });
        const res = await DELETE(req, { params: Promise.resolve({ id: '' }) });
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toContain('Demo ID is required');
    });

    it('soft deletes by default', async () => {
        mockFrom.mockReturnValue({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
        });

        const req = createMockRequest(`http://localhost/api/demo/${demoId}`, {
            method: 'DELETE',
        });

        const res = await DELETE(req, { params: Promise.resolve({ id: demoId }) });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.id).toBe(demoId);
    });

    it('hard deletes when hard=true', async () => {
        mockFrom.mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
        });

        const req = createMockRequest(`http://localhost/api/demo/${demoId}?hard=true`, {
            method: 'DELETE',
        });

        const res = await DELETE(req, { params: Promise.resolve({ id: demoId }) });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });
});
