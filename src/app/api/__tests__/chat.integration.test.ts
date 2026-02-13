import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../chat/route';
import { createMockRequest } from './helpers';

const mockFrom = vi.fn();
const mockSupabaseClient = vi.fn();

vi.mock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => mockSupabaseClient()),
}));

vi.mock('@/lib/openrouter', () => ({
    getOpenRouterClient: vi.fn(() => ({
        isConfigured: vi.fn().mockReturnValue(false),
        chatStream: vi.fn(),
    })),
    OpenRouterClient: {
        estimateTokens: vi.fn(() => 5),
    },
}));

const validDemoId = 'a24a6ea4-ce75-4665-a070-57453082c256';
const validLeadId = 'V1StGXR8_Z5jdHJ8k2'; // nanoid-style, 18 chars

describe('POST /api/chat', () => {
    const baseUrl = 'http://localhost/api/chat';

    beforeEach(() => {
        vi.clearAllMocks();

        mockSupabaseClient.mockReturnValue({
            from: mockFrom,
        });

        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: {
                    id: 'demo-1',
                    status: 'draft',
                    company_name: 'Acme',
                    mission_profile: 'reactivation',
                },
                error: null,
            }),
        });
    });

    it('returns 400 when demoId is missing', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { message: 'Hello' },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('demoId');
    });

    it('returns 400 when message is missing', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { demoId: validDemoId },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('message is required');
    });

    it('returns 404 when demo not found', async () => {
        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
            }),
        });

        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { demoId: '00000000-0000-0000-0000-000000000001', message: 'Hello' },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.error).toBe('Demo not found');
    });

    it('returns 503 when OpenRouter is not configured', async () => {
        const req = createMockRequest(baseUrl, {
            method: 'POST',
            body: { demoId: validDemoId, message: 'Hello' },
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(503);
        expect(data.error).toContain('AI service not configured');
    });
});

describe('GET /api/chat', () => {
    const baseUrl = 'http://localhost/api/chat';

    beforeEach(() => {
        vi.clearAllMocks();

        mockSupabaseClient.mockReturnValue({
            from: mockFrom,
        });
    });

    it('returns 400 when demoId or leadIdentifier is missing', async () => {
        const req = createMockRequest(baseUrl);
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toMatch(/demoId|leadIdentifier|invalid/i);
    });

    it('returns messages for valid params', async () => {
        const leadChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'lead-1' }, error: null }),
        };
        const sessionsChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: 'session-1' }] }),
        };
        const messagesChain = {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: [
                    { role: 'assistant', content: 'Hi!', created_at: '2024-01-01' },
                    { role: 'user', content: 'Hello', created_at: '2024-01-01' },
                ],
            }),
        };

        mockFrom
            .mockReturnValueOnce(leadChain)
            .mockReturnValueOnce(sessionsChain)
            .mockReturnValueOnce(messagesChain);

        const req = createMockRequest(
            `http://localhost/api/chat?demoId=${validDemoId}&leadIdentifier=${validLeadId}`
        );
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.messages).toBeDefined();
        expect(data.messages).toHaveLength(2);
    });

    it('returns empty messages when lead not found', async () => {
        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
            }),
        });

        const req = createMockRequest(
            `http://localhost/api/chat?demoId=${validDemoId}&leadIdentifier=${validLeadId}`
        );
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.messages).toEqual([]);
    });
});
