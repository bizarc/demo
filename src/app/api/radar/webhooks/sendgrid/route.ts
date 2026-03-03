import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyEventWebhookSignature } from '@/lib/radarSendgrid';

/**
 * POST /api/radar/webhooks/sendgrid
 * Receives SendGrid Event Webhook events.
 * Verifies HMAC-SHA256 signature, maps events to outreach_events.
 */
export async function POST(request: NextRequest) {
    const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret) {
        const signature = request.headers.get('x-twilio-email-event-webhook-signature') || '';
        const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp') || '';
        const rawBody = await request.text();

        const valid = await verifyEventWebhookSignature(rawBody, signature, timestamp, webhookSecret);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        // Re-parse body since we consumed it
        let events: any[];
        try {
            events = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        await processEvents(events);
    } else {
        // No signature verification (dev/testing)
        let events: any[];
        try {
            events = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }
        await processEvents(events);
    }

    return NextResponse.json({ received: true });
}

const EVENT_TYPE_MAP: Record<string, string> = {
    delivered: 'delivered',
    bounce: 'bounced',
    open: 'opened',
    click: 'clicked',
    unsubscribe: 'unsubscribed',
    spamreport: 'unsubscribed',
};

async function processEvents(events: any[]) {
    if (!Array.isArray(events) || events.length === 0) return;

    const supabase = createServerClient();

    for (const event of events) {
        const eventType = EVENT_TYPE_MAP[event.event];
        if (!eventType) continue;

        const campaignId = event.campaign_id || null;
        const enrollmentId = event.enrollment_id || null;
        const trackingId = event.tracking_id || null;

        // Look up prospect by enrollment if enrollment_id is present
        let prospectId: string | null = null;
        if (enrollmentId) {
            const { data: enrollment } = await supabase
                .from('campaign_enrollments')
                .select('prospect_id')
                .eq('id', enrollmentId)
                .maybeSingle();
            prospectId = enrollment?.prospect_id || null;
        }

        try {
            await supabase.from('outreach_events').insert({
                campaign_id: campaignId,
                prospect_id: prospectId,
                enrollment_id: enrollmentId,
                event_type: eventType,
                channel: 'email',
                tracking_id: trackingId ? `sg-${trackingId}-${Date.now()}` : undefined,
                ip_address: event.ip,
                user_agent: event.useragent,
                metadata: {
                    sendgrid_event: event.event,
                    email: event.email,
                    url: event.url,
                    reason: event.reason,
                    type: event.type,
                    sg_event_id: event.sg_event_id,
                    timestamp: event.timestamp,
                },
            });

            // Hard bounce — update prospect status
            if (event.event === 'bounce' && event.type === 'bounce' && prospectId) {
                await supabase
                    .from('prospects')
                    .update({
                        status: 'bounced',
                        bounced_at: new Date().toISOString(),
                        bounce_type: 'hard',
                    })
                    .eq('id', prospectId);

                // Stop all active enrollments for this prospect
                await supabase
                    .from('campaign_enrollments')
                    .update({ status: 'bounced' })
                    .eq('prospect_id', prospectId)
                    .in('status', ['active', 'paused']);
            }

            // Soft bounce — mark bounce type only
            if (event.event === 'bounce' && event.type === 'blocked' && prospectId) {
                await supabase
                    .from('prospects')
                    .update({ bounce_type: 'soft' })
                    .eq('id', prospectId)
                    .eq('status', 'active');
            }
        } catch (err) {
            console.error('SendGrid webhook event processing error:', err);
        }
    }
}
