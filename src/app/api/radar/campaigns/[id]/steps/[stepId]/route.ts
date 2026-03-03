import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** PATCH /api/radar/campaigns/[id]/steps/[stepId] */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; stepId: string } }
) {
    const { id, stepId } = params;
    if (!isValidUUID(id) || !isValidUUID(stepId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const body = await request.json();
        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('campaign_steps')
            .update(body)
            .eq('id', stepId)
            .eq('campaign_id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
        if (!data) return NextResponse.json({ error: 'Step not found' }, { status: 404 });

        return NextResponse.json({ step: data });
    } catch (err) {
        console.error('Step PATCH error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** DELETE /api/radar/campaigns/[id]/steps/[stepId] — Deletes and renumbers remaining steps */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; stepId: string } }
) {
    const { id, stepId } = params;
    if (!isValidUUID(id) || !isValidUUID(stepId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();

        // Load step to get its number
        const { data: step } = await supabase
            .from('campaign_steps')
            .select('step_number')
            .eq('id', stepId)
            .eq('campaign_id', id)
            .single();

        if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 });

        await supabase.from('campaign_steps').delete().eq('id', stepId);

        // Renumber steps after the deleted one
        const { data: later } = await supabase
            .from('campaign_steps')
            .select('id, step_number')
            .eq('campaign_id', id)
            .gt('step_number', step.step_number)
            .order('step_number', { ascending: true });

        for (const s of later || []) {
            await supabase
                .from('campaign_steps')
                .update({ step_number: s.step_number - 1 })
                .eq('id', s.id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Step DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
