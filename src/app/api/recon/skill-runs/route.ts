import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listSkillRuns } from '@/lib/skillCatalog';

/**
 * GET /api/recon/skill-runs
 * List skill runs with optional filters. Query: status, lifecycle_state, skill_key, limit, offset
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const lifecycle_state = searchParams.get('lifecycle_state') ?? undefined;
    const skill_key = searchParams.get('skill_key') ?? undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    try {
        const { runs, total } = await listSkillRuns({
            status,
            lifecycle_state,
            skill_key,
            limit,
            offset,
        });
        return Response.json({ runs, total });
    } catch (err) {
        console.error('List skill runs error:', err);
        return Response.json(
            { error: err instanceof Error ? err.message : 'Failed to list skill runs' },
            { status: 500 }
        );
    }
}
