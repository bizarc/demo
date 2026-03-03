import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/radar/track/click/[trackingId]?url=<destination>
 * Public — no auth required.
 * Logs 'clicked' event and redirects to destination URL.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { trackingId: string } }
) {
    const { trackingId } = params;
    const { searchParams } = new URL(request.url);
    const destinationUrl = searchParams.get('url');

    if (!destinationUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate destination URL is http/https
    try {
        const parsed = new URL(destinationUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return NextResponse.json({ error: 'Invalid destination URL' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid destination URL' }, { status: 400 });
    }

    // Non-blocking event log
    try {
        const supabase = createServerClient();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
        const userAgent = request.headers.get('user-agent') || undefined;

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
                event_type: 'clicked',
                channel: 'email',
                tracking_id: `${trackingId}-click-${Date.now()}`,
                ip_address: ip,
                user_agent: userAgent,
                metadata: { destination_url: destinationUrl },
            });
        }
    } catch (err) {
        console.error('Click tracking error:', err);
    }

    return NextResponse.redirect(destinationUrl, 302);
}
