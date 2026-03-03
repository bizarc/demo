import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** GET /api/radar/prospects/[id] */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isValidUUID(id)) {
        return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { data, error } = await supabase
            .from('prospects')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

        // Enrollment history
        const { data: enrollments } = await supabase
            .from('campaign_enrollments')
            .select('id, campaign_id, status, current_step, enrolled_at, next_send_at, campaigns(name)')
            .eq('prospect_id', id)
            .order('enrolled_at', { ascending: false });

        // Recent events
        const { data: events } = await supabase
            .from('outreach_events')
            .select('id, event_type, subject, step_number, occurred_at, channel')
            .eq('prospect_id', id)
            .order('occurred_at', { ascending: false })
            .limit(20);

        return NextResponse.json({ prospect: data, enrollments: enrollments || [], events: events || [] });
    } catch (err) {
        console.error('RADAR prospect GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** PATCH /api/radar/prospects/[id] — Optimistic locking via version */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isValidUUID(id)) {
        return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const body = await request.json();
        const { version, ...updates } = body;

        if (!version) return NextResponse.json({ error: 'version field required for updates' }, { status: 400 });

        // Normalize email if present
        if (updates.email) updates.email = updates.email.toLowerCase();

        const supabase = createServerClient();
        const { data, error } = await supabase
            .from('prospects')
            .update({ ...updates, version: version + 1 })
            .eq('id', id)
            .eq('version', version)
            .select()
            .single();

        if (error) {
            console.error('Prospect update error:', error);
            return NextResponse.json({ error: 'Failed to update prospect' }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ error: 'Conflict: prospect was modified by another request' }, { status: 409 });
        }

        return NextResponse.json({ prospect: data });
    } catch (err) {
        console.error('RADAR prospect PATCH error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** DELETE /api/radar/prospects/[id] */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isValidUUID(id)) {
        return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { error } = await supabase.from('prospects').delete().eq('id', id);

        if (error) {
            console.error('Prospect delete error:', error);
            return NextResponse.json({ error: 'Failed to delete prospect' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('RADAR prospect DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
