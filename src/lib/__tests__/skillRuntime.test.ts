import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSkill } from '../skillRuntime';

vi.mock('../skillCatalog', () => ({
    getSkillByKey: vi.fn(),
    isExecutionModeAllowed: vi.fn(() => ({ allowed: true })),
    createSkillRun: vi.fn(() => Promise.resolve({ id: 'run-123' })),
    completeSkillRun: vi.fn(() => Promise.resolve()),
}));

vi.mock('../openrouter', () => ({
    getOpenRouterClient: vi.fn(() => ({
        isConfigured: () => true,
        chat: () => Promise.resolve(JSON.stringify({
            summary: 'Test summary',
            competitors: ['A', 'B'],
            context_block: 'Test context block',
        })),
    })),
}));

vi.mock('../supabase', () => ({
    createServerClient: vi.fn(() => ({
        from: (table: string) => {
            if (table === 'research_records') {
                return {
                    insert: () => ({
                        select: () => ({
                            single: () => Promise.resolve({
                                data: { id: 'research-record-1' },
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === 'research_links') {
                return { insert: () => Promise.resolve({ error: null }) };
            }
            return {};
        },
    })),
}));

import { getSkillByKey } from '../skillCatalog';

describe('executeSkill', () => {
    beforeEach(() => {
        vi.mocked(getSkillByKey).mockReset();
    });

    it('throws when skill not found', async () => {
        vi.mocked(getSkillByKey).mockResolvedValue(null);
        await expect(
            executeSkill({
                skillKey: 'research.company.profile.v1',
                executionMode: 'assist',
                input: { companyName: 'Acme' },
                userId: 'user-1',
                role: 'operator',
            })
        ).rejects.toThrow('Skill not found');
    });

    it('returns runId, status, and output shape for research skill', async () => {
        vi.mocked(getSkillByKey).mockResolvedValue({
            id: 'skill-1',
            skill_key: 'research.company.profile.v1',
            skill_family: 'research',
            name: 'Company Intelligence',
            description: null,
            domain_tags: [],
            execution_modes: ['assist', 'hitl'],
            input_schema: {},
            output_schema: {},
            quality_gates: [],
            approval_requirements: {},
            config_defaults: {},
            version: 1,
            status: 'active',
            created_by: null,
            created_at: '',
            updated_at: '',
        } as any);

        const result = await executeSkill({
            skillKey: 'research.company.profile.v1',
            executionMode: 'assist',
            input: { companyName: 'Acme Corp' },
            userId: 'user-1',
            role: 'operator',
        });

        expect(result).toHaveProperty('runId', 'run-123');
        expect(result).toHaveProperty('status', 'completed');
        expect(result).toHaveProperty('lifecycleState', 'draft');
        expect(result.outputPayload).toBeDefined();
        expect(result.outputPayload).toHaveProperty('summary');
        expect(result.outputPayload).toHaveProperty('competitors');
        expect(result.outputPayload).toHaveProperty('context_block');
        expect(result.outputAssetId).toBe('research-record-1');
    });
});
