import { NextRequest } from 'next/server';
import { requireAuth, getProfileRole } from '@/lib/auth';
import { executeSkill, type ExecutionMode } from '@/lib/skillRuntime';

/**
 * POST /api/recon/skills/execute
 * Execute a skill by key with execution mode and input. Policy and audit applied.
 * Body: { skillKey: string; executionMode: 'assist' | 'hitl' | 'autonomous'; input: Record<string, unknown> }
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const body = await request.json().catch(() => ({}));
    const { skillKey, executionMode, input } = body as {
        skillKey?: string;
        executionMode?: string;
        input?: Record<string, unknown>;
    };

    const key = typeof skillKey === 'string' ? skillKey.trim() : '';
    if (!key) {
        return Response.json({ error: 'skillKey is required' }, { status: 400 });
    }

    const mode = (executionMode === 'assist' || executionMode === 'hitl' || executionMode === 'autonomous'
        ? executionMode
        : 'assist') as ExecutionMode;

    const inputPayload = input && typeof input === 'object' ? input : {};

    const userId = authResult.userId ?? null;
    const role = await getProfileRole(userId ?? '');

    try {
        const result = await executeSkill({
            skillKey: key,
            executionMode: mode,
            input: inputPayload,
            userId,
            role,
        });
        return Response.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Skill execution failed';
        console.error('Skill execute error:', err);
        return Response.json({ error: message }, { status: 400 });
    }
}
