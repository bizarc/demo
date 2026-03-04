import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { updateSkillRunLifecycle } from '@/lib/skillCatalog';

/**
 * PATCH /api/recon/skill-runs/[id]
 * Approval gate: set lifecycle_state (reviewed | approved | archived), optional rejection_reason.
 * Body: { lifecycle_state: string; rejection_reason?: string }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const { id } = await params;
    if (!id) {
        return Response.json({ error: 'Run ID required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { lifecycle_state, rejection_reason } = body as {
        lifecycle_state?: string;
        rejection_reason?: string | null;
    };

    const state = lifecycle_state === 'reviewed' || lifecycle_state === 'approved' || lifecycle_state === 'archived'
        ? lifecycle_state
        : undefined;
    if (!state) {
        return Response.json(
            { error: 'lifecycle_state must be one of: reviewed, approved, archived' },
            { status: 400 }
        );
    }

    const userId = authResult.userId ?? null;

    try {
        await updateSkillRunLifecycle(id, {
            lifecycle_state: state,
            approved_by: state !== 'archived' ? userId : null,
            rejection_reason: rejection_reason ?? undefined,
        });
        return Response.json({ id, lifecycle_state: state });
    } catch (err) {
        console.error('Update skill run lifecycle error:', err);
        return Response.json(
            { error: err instanceof Error ? err.message : 'Failed to update run' },
            { status: 500 }
        );
    }
}
