/**
 * Twilio SMS webhook. Receives inbound SMS and responds with AI.
 * Configure in Twilio: Messaging -> Webhook URL -> POST to this route.
 *
 * Flow:
 * 1. Prospect texts "START-<short_code>" to our number
 * 2. We find demo by sms_short_code
 * 3. Find/create lead by phone (From)
 * 4. Process message through chat engine
 * 5. Respond with TwiML (plain text)
 *
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processMessageSync } from '@/lib/chatEngine';
import { getClientIp, checkRateLimit, CHAT_LIMIT } from '@/lib/rateLimit';

async function findOrCreateLead(
    supabase: ReturnType<typeof createServerClient>,
    demoId: string,
    phone: string
) {
    const { data: existing } = await supabase
        .from('leads')
        .select('*')
        .eq('demo_id', demoId)
        .eq('identifier', phone)
        .single();

    if (existing) {
        await supabase
            .from('leads')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', existing.id);
        return existing;
    }

    const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
            demo_id: demoId,
            identifier: phone,
            identifier_type: 'phone',
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    return newLead!;
}

async function findOrCreateSession(
    supabase: ReturnType<typeof createServerClient>,
    leadId: string,
    demoId: string
) {
    const { data: existing } = await supabase
        .from('sessions')
        .select('*')
        .eq('lead_id', leadId)
        .eq('demo_id', demoId)
        .eq('channel', 'sms')
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (existing) return existing;

    const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({
            lead_id: leadId,
            demo_id: demoId,
            channel: 'sms',
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return newSession!;
}

async function loadLeadHistory(
    supabase: ReturnType<typeof createServerClient>,
    leadId: string
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('lead_id', leadId);

    if (!sessions?.length) return [];

    const sessionIds = sessions.map(s => s.id);
    const { data: messages } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .in('session_id', sessionIds)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true });

    if (!messages) return [];

    return messages.slice(-50).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
    }));
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`twilio-sms:${ip}`, CHAT_LIMIT);
    if (!allowed) {
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Rate limit exceeded. Try again later.</Message></Response>',
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.error('Twilio not configured');
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Service temporarily unavailable.</Message></Response>',
            { headers: { 'Content-Type': 'text/xml' }, status: 503 }
        );
    }

    let body: Record<string, string>;
    try {
        const formData = await request.formData();
        body = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)]));
    } catch {
        return new NextResponse('Bad Request', { status: 400 });
    }

    const from = body.From || body.from;
    const msgBody = (body.Body || body.body || '').trim();

    if (!from || !msgBody) {
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response/>',
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }

    // Parse START-<code> or START <code>
    const startMatch = msgBody.match(/^START[- ]?(\w+)$/i) || msgBody.match(/^(\w{6,12})$/);
    const shortCode = startMatch ? (startMatch[1] || msgBody).toLowerCase() : null;

    const supabase = createServerClient();

    // If we have a short code, find demo; otherwise we need an existing session to continue conversation
    let demoId: string | null = null;

    if (shortCode) {
        const { data: demo } = await supabase
            .from('demos')
            .select('id, status, expires_at')
            .eq('sms_short_code', shortCode)
            .single();

        if (demo && demo.status === 'active') {
            if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
                return new NextResponse(
                    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>This demo has expired.</Message></Response>`,
                    { headers: { 'Content-Type': 'text/xml' } }
                );
            }
            demoId = demo.id;
        }
    }

    if (!demoId) {
        // Check if this phone has an active session (continue conversation)
        const { data: leads } = await supabase
            .from('leads')
            .select('demo_id')
            .eq('identifier', from)
            .eq('identifier_type', 'phone');

        for (const lead of leads || []) {
            const { data: d } = await supabase
                .from('demos')
                .select('status, expires_at')
                .eq('id', lead.demo_id)
                .single();
            if (d?.status === 'active' && (!d.expires_at || new Date(d.expires_at) >= new Date())) {
                demoId = lead.demo_id;
                break;
            }
        }
    }

    if (!demoId) {
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?><Response><Message>To start, text START followed by your demo code (e.g. START-abc12345). Get your code from the demo link.</Message></Response>`,
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }

    const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('id', demoId)
        .single();

    if (demoError || !demo) {
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Demo not found.</Message></Response>',
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }

    try {
        const lead = await findOrCreateLead(supabase, demoId, from);
        const session = await findOrCreateSession(supabase, lead.id, demoId);
        const history = await loadLeadHistory(supabase, lead.id);

        const saveMessageFn = async (
            sid: string,
            role: 'user' | 'assistant',
            content: string,
            tokenCount: number
        ) => {
            await supabase.from('messages').insert({
                session_id: sid,
                role,
                content,
                token_count: tokenCount,
            });
        };

        await saveMessageFn(session.id, 'user', msgBody, 0);

        const { content } = await processMessageSync({
            demo,
            leadIdentifier: from,
            message: msgBody,
            history,
            channel: 'sms',
            sessionId: session.id,
            saveMessageFn,
        });

        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(content)}</Message></Response>`,
            { headers: { 'Content-Type': 'text/xml' } }
        );
    } catch (err) {
        console.error('Twilio SMS error:', err);
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, something went wrong. Please try again.</Message></Response>',
            { headers: { 'Content-Type': 'text/xml' }, status: 500 }
        );
    }
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
