import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listSkills } from '@/lib/skillCatalog';
import type { SkillFamily } from '@/lib/skillCatalog';

/**
 * GET /api/recon/skills
 * List active skills from the catalog. Query: ?family=research|knowledge_base|outreach
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const { searchParams } = new URL(request.url);
    const family = searchParams.get('family') as SkillFamily | null;

    try {
        const skills = await listSkills(family ?? undefined);
        return Response.json({ skills });
    } catch (err) {
        console.error('List skills error:', err);
        return Response.json(
            { error: err instanceof Error ? err.message : 'Failed to list skills' },
            { status: 500 }
        );
    }
}
