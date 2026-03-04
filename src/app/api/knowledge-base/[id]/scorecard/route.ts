import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';
import { getKbScorecard } from '@/lib/kbScorecard';

/**
 * GET /api/knowledge-base/[id]/scorecard — Quality scorecard for a KB
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id || !isValidUuid(id)) {
            return NextResponse.json(
                { error: 'Invalid knowledge base ID' },
                { status: 400 }
            );
        }

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`kb:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const scorecard = await getKbScorecard(id);
        if (!scorecard) {
            return NextResponse.json(
                { error: 'Knowledge base not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(scorecard);
    } catch (error) {
        console.error('KB scorecard error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
