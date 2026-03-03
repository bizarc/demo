import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

/** GET /api/radar/discover/sessions — List past discovery sessions */
export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { data, error } = await supabase
            .from('discovery_sessions')
            .select('id, query, result_count, imported_count, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return NextResponse.json({ sessions: data || [] });
    } catch (err) {
        console.error('Discovery sessions error:', err);
        return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
    }
}
