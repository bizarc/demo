import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import { getAggregateAnalytics } from '@/lib/radar';

/**
 * GET /api/radar/analytics — Aggregate analytics across all campaigns
 */
export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const supabase = createServerClient();
        const analytics = await getAggregateAnalytics(supabase);

        return NextResponse.json(analytics);
    } catch (err) {
        console.error('RADAR aggregate analytics error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
