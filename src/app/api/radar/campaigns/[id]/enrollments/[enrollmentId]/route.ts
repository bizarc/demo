import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** DELETE /api/radar/campaigns/[id]/enrollments/[enrollmentId] — Remove enrollment */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; enrollmentId: string } }
) {
    const { id, enrollmentId } = params;
    if (!isValidUUID(id) || !isValidUUID(enrollmentId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { error } = await supabase
            .from('campaign_enrollments')
            .delete()
            .eq('id', enrollmentId)
            .eq('campaign_id', id);

        if (error) return NextResponse.json({ error: 'Failed to remove enrollment' }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Enrollment DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
