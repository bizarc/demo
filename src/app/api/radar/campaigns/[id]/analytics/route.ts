import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import { getCampaignAnalytics } from '@/lib/radar';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** GET /api/radar/campaigns/[id]/analytics */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const analytics = await getCampaignAnalytics(supabase, id);

        return NextResponse.json(analytics);
    } catch (err) {
        console.error('Campaign analytics error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
