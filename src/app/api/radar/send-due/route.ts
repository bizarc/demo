import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';
import { RADAR_CRON_LIMIT } from '@/lib/rateLimit';
import { processDueEnrollments } from '@/lib/radar';

/**
 * POST /api/radar/send-due — Vercel Cron endpoint
 * Auth: Bearer RADAR_CRON_SECRET (not Supabase auth)
 * Called every 5 minutes by Vercel Cron
 */
export async function POST(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.RADAR_CRON_SECRET;

    if (!cronSecret) {
        console.error('RADAR_CRON_SECRET not configured');
        return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit cron calls (extra protection)
    const { allowed } = checkRateLimit('radar:cron', RADAR_CRON_LIMIT);
    if (!allowed) {
        return NextResponse.json({ error: 'Cron rate limit exceeded — already running' }, { status: 429 });
    }

    try {
        const supabase = createServerClient();
        const result = await processDueEnrollments(supabase);

        console.log(`RADAR cron result:`, result);
        return NextResponse.json(result);
    } catch (err) {
        console.error('RADAR cron error:', err);
        return NextResponse.json({ error: 'Cron failed', detail: String(err) }, { status: 500 });
    }
}
