import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/radar/inbound/email
 * Handles inbound reply detection from SendGrid Inbound Parse webhook.
 * Matches sender email to enrolled prospects, logs 'replied' event,
 * updates enrollment status to 'replied'.
 */
export async function POST(request: NextRequest) {
    try {
        let senderEmail: string | null = null;
        let subject: string | null = null;
        let bodyPreview: string | null = null;
        let inReplyTo: string | null = null;

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            senderEmail = (formData.get('from') as string || '').toLowerCase().trim();
            // Extract email address from "Name <email>" format
            const emailMatch = senderEmail.match(/<([^>]+)>/);
            if (emailMatch) senderEmail = emailMatch[1].toLowerCase();
            subject = formData.get('subject') as string || null;
            const text = formData.get('text') as string || '';
            bodyPreview = text.slice(0, 200);
            inReplyTo = formData.get('headers') ?
                (formData.get('headers') as string).match(/In-Reply-To:\s*<([^>]+)>/i)?.[1] || null
                : null;
        } else {
            const body = await request.json().catch(() => ({}));
            senderEmail = (body.from || '').toLowerCase().trim();
            subject = body.subject || null;
            bodyPreview = (body.text || '').slice(0, 200);
            inReplyTo = body.in_reply_to || null;
        }

        if (!senderEmail) {
            return NextResponse.json({ error: 'No sender email' }, { status: 400 });
        }

        const supabase = createServerClient();

        // Find prospect by email
        const { data: prospect } = await supabase
            .from('prospects')
            .select('id')
            .eq('email', senderEmail)
            .maybeSingle();

        if (!prospect) {
            // Not a tracked prospect — ignore
            return NextResponse.json({ received: true, matched: false });
        }

        // Find active enrollment(s) for this prospect
        const { data: enrollments } = await supabase
            .from('campaign_enrollments')
            .select('id, campaign_id, current_step')
            .eq('prospect_id', prospect.id)
            .in('status', ['active', 'paused'])
            .order('enrolled_at', { ascending: false })
            .limit(1);

        const enrollment = enrollments?.[0];

        if (enrollment) {
            // Update enrollment status to replied
            await supabase
                .from('campaign_enrollments')
                .update({ status: 'replied' })
                .eq('id', enrollment.id);

            // Log replied event
            await supabase.from('outreach_events').insert({
                campaign_id: enrollment.campaign_id,
                prospect_id: prospect.id,
                enrollment_id: enrollment.id,
                step_number: enrollment.current_step,
                event_type: 'replied',
                channel: 'email',
                subject,
                body_preview: bodyPreview,
                metadata: { in_reply_to: inReplyTo },
            });
        }

        return NextResponse.json({ received: true, matched: true, enrollment_id: enrollment?.id || null });
    } catch (err) {
        console.error('RADAR inbound email error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
