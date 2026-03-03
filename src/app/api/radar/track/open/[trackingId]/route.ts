import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// 1×1 transparent GIF bytes
const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

/**
 * GET /api/radar/track/open/[trackingId]
 * Public — no auth required.
 * Logs 'opened' event and returns a 1x1 transparent GIF.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { trackingId: string } }
) {
    const { trackingId } = params;

    // Non-blocking event log
    try {
        const supabase = createServerClient();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
        const userAgent = request.headers.get('user-agent') || undefined;

        // Look up the tracking record
        const { data: existingEvent } = await supabase
            .from('outreach_events')
            .select('id, campaign_id, prospect_id, enrollment_id, step_number')
            .eq('tracking_id', trackingId)
            .eq('event_type', 'sent')
            .maybeSingle();

        if (existingEvent) {
            await supabase.from('outreach_events').insert({
                campaign_id: existingEvent.campaign_id,
                prospect_id: existingEvent.prospect_id,
                enrollment_id: existingEvent.enrollment_id,
                step_number: existingEvent.step_number,
                event_type: 'opened',
                channel: 'email',
                tracking_id: `${trackingId}-open-${Date.now()}`,
                ip_address: ip,
                user_agent: userAgent,
            });
        }
    } catch (err) {
        // Non-fatal — still return the pixel
        console.error('Open tracking error:', err);
    }

    return new NextResponse(TRANSPARENT_GIF, {
        status: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
