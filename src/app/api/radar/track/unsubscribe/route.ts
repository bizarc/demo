import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyUnsubscribeToken } from '@/lib/radarPrompts';

/**
 * POST /api/radar/track/unsubscribe
 * Public — no auth required.
 * Verifies HMAC token, sets prospect + enrollment status to unsubscribed.
 * Also handles List-Unsubscribe-Post one-click POST from mail clients.
 */
export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');

    // Also accept token in body (one-click POST format)
    if (!token) {
        try {
            const body = await request.formData();
            token = body.get('List-Unsubscribe') as string || null;
        } catch {
            // Also try JSON body
            try {
                const body = await request.json();
                token = body.token;
            } catch {
                // ignore
            }
        }
    }

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const decoded = await verifyUnsubscribeToken(token);
    if (!decoded) {
        return NextResponse.json({ error: 'Invalid or expired unsubscribe token' }, { status: 400 });
    }

    const { prospectId, enrollmentId } = decoded;

    try {
        const supabase = createServerClient();
        const now = new Date().toISOString();

        // Update prospect status
        await supabase
            .from('prospects')
            .update({ status: 'unsubscribed', unsubscribed_at: now })
            .eq('id', prospectId);

        // Update all active enrollments for this prospect
        await supabase
            .from('campaign_enrollments')
            .update({ status: 'unsubscribed' })
            .eq('prospect_id', prospectId)
            .in('status', ['active', 'paused']);

        // Log unsubscribe event
        const { data: enrollment } = await supabase
            .from('campaign_enrollments')
            .select('campaign_id, current_step')
            .eq('id', enrollmentId)
            .maybeSingle();

        if (enrollment) {
            await supabase.from('outreach_events').insert({
                campaign_id: enrollment.campaign_id,
                prospect_id: prospectId,
                enrollment_id: enrollmentId,
                step_number: enrollment.current_step,
                event_type: 'unsubscribed',
                channel: 'email',
            });
        }

        return NextResponse.json({ success: true, message: 'You have been unsubscribed.' });
    } catch (err) {
        console.error('Unsubscribe error:', err);
        return NextResponse.json({ error: 'Unsubscribe failed' }, { status: 500 });
    }
}

/** GET — Show a simple unsubscribe confirmation page */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return new NextResponse('Missing token', { status: 400 });
    }

    const decoded = await verifyUnsubscribeToken(token);
    if (!decoded) {
        return new NextResponse('Invalid unsubscribe link.', { status: 400 });
    }

    // Auto-process via redirect to POST (or show a confirm page)
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Unsubscribe</title>
<style>body{font-family:sans-serif;max-width:400px;margin:80px auto;text-align:center;color:#333}
h1{font-size:1.5rem}p{color:#666;font-size:.9rem}.btn{margin-top:1.5rem;padding:.75rem 2rem;background:#111;color:#fff;border:none;border-radius:.375rem;cursor:pointer;font-size:1rem}</style>
</head>
<body>
<h1>Unsubscribe</h1>
<p>Click the button below to confirm your unsubscribe request.</p>
<form method="POST">
  <input type="hidden" name="token" value="${encodeURIComponent(token)}" />
  <button class="btn" type="submit">Confirm Unsubscribe</button>
</form>
</body>
</html>`;

    return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
}
