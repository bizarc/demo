import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** POST /api/radar/campaigns/[id]/resume */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { data: campaign } = await supabase
            .from('campaigns').select('status, version').eq('id', id).single();

        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        if (campaign.status !== 'paused') {
            return NextResponse.json({ error: 'Only paused campaigns can be resumed' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .update({ status: 'active', version: campaign.version + 1 })
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: 'Failed to resume campaign' }, { status: 500 });
        return NextResponse.json({ campaign: data });
    } catch (err) {
        console.error('Campaign resume error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
