import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** GET /api/radar/campaigns/[id] */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

        return NextResponse.json({ campaign: data });
    } catch (err) {
        console.error('Campaign GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** PATCH /api/radar/campaigns/[id] — Optimistic locking */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const body = await request.json();
        const { version, ...updates } = body;
        if (!version) return NextResponse.json({ error: 'version required' }, { status: 400 });

        const supabase = createServerClient();
        const { data, error } = await supabase
            .from('campaigns')
            .update({ ...updates, version: version + 1 })
            .eq('id', id)
            .eq('version', version)
            .select()
            .single();

        if (error) return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
        if (!data) return NextResponse.json({ error: 'Conflict: campaign modified by another request' }, { status: 409 });

        return NextResponse.json({ campaign: data });
    } catch (err) {
        console.error('Campaign PATCH error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** DELETE /api/radar/campaigns/[id] */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { error } = await supabase.from('campaigns').delete().eq('id', id);

        if (error) return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Campaign DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
