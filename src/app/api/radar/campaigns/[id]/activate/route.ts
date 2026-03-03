import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** POST /api/radar/campaigns/[id]/activate — Validate and set status to active */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();

        const { data: campaign, error: fetchErr } = await supabase
            .from('campaigns')
            .select('id, status, from_email, version')
            .eq('id', id)
            .single();

        if (fetchErr || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        if (campaign.status !== 'draft' && campaign.status !== 'paused') {
            return NextResponse.json({ error: `Cannot activate a campaign with status: ${campaign.status}` }, { status: 400 });
        }
        if (!campaign.from_email) {
            return NextResponse.json({ error: 'Campaign must have a from_email before activating' }, { status: 400 });
        }

        // Verify at least one step exists
        const { count } = await supabase
            .from('campaign_steps')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', id);

        if (!count || count === 0) {
            return NextResponse.json({ error: 'Campaign must have at least one step before activating' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .update({ status: 'active', version: campaign.version + 1 })
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: 'Failed to activate campaign' }, { status: 500 });
        return NextResponse.json({ campaign: data });
    } catch (err) {
        console.error('Campaign activate error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
