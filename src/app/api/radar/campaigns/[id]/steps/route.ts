import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** GET /api/radar/campaigns/[id]/steps */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { data, error } = await supabase
            .from('campaign_steps')
            .select('*')
            .eq('campaign_id', id)
            .order('step_number', { ascending: true });

        if (error) return NextResponse.json({ error: 'Failed to load steps' }, { status: 500 });
        return NextResponse.json({ steps: data || [] });
    } catch (err) {
        console.error('Steps GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** POST /api/radar/campaigns/[id]/steps — Add a step */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();

        // Get next step number
        const { data: existing } = await supabase
            .from('campaign_steps')
            .select('step_number')
            .eq('campaign_id', id)
            .order('step_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextStepNumber = (existing?.step_number || 0) + 1;

        const body = await request.json();
        const { data, error } = await supabase
            .from('campaign_steps')
            .insert({ campaign_id: id, step_number: nextStepNumber, ...body })
            .select()
            .single();

        if (error) {
            console.error('Step create error:', error);
            return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
        }

        return NextResponse.json({ step: data }, { status: 201 });
    } catch (err) {
        console.error('Steps POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
