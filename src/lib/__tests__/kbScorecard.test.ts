import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => ({
        from: (table: string) => {
            if (table === 'knowledge_bases') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({
                                data: {
                                    id: 'kb-1',
                                    name: 'Test KB',
                                    type: 'faq',
                                    status: 'draft',
                                },
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === 'documents') {
                return {
                    select: () => ({
                        eq: () => Promise.resolve({
                            data: [
                                { id: 'd1', chunk_count: 10 },
                                { id: 'd2', chunk_count: 5 },
                            ],
                            error: null,
                        }),
                    }),
                };
            }
            return {};
        },
    })),
}));

import { getKbScorecard } from '../kbScorecard';

describe('getKbScorecard', () => {
    it('returns scorecard with document and chunk counts', async () => {
        const scorecard = await getKbScorecard('kb-1');
        expect(scorecard).not.toBeNull();
        expect(scorecard!.document_count).toBe(2);
        expect(scorecard!.total_chunks).toBe(15);
        expect(scorecard!.recommendation).toBeDefined();
        expect(scorecard!.checks).toBeDefined();
        expect(scorecard!.checks.length).toBeGreaterThan(0);
    });
});
