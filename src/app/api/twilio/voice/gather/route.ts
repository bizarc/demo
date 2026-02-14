/**
 * Twilio Voice: handles DTMF input (8-digit demo code).
 * Redirected from /api/twilio/voice after <Gather>.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processMessageSync } from '@/lib/chatEngine';
import { getClientIp, checkRateLimit, CHAT_LIMIT } from '@/lib/rateLimit';

function twiml(verbs: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?><Response>${verbs}</Response>`;
}

function say(text: string): string {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    return `<Say>${escaped}</Say>`;
}

function gatherSpeech(demoId: string, sessionId: string, prompt: string): string {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
    const url = `${base.replace(/\/$/, '')}/api/twilio/voice/speech?demoId=${demoId}&sessionId=${sessionId}`;
    return say(prompt) + `<Gather input="speech" action="${url}" method="POST" speechTimeout="2" timeout="5"/>`;
}

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
        await supabase.from('leads').update({ last_seen_at: new Date().toISOString() }).eq('id', existing.id);
        return existing;
    }

    const { data: newLead, error } = await supabase
        .from('leads')
        .insert({ demo_id: demoId, identifier: phone, identifier_type: 'phone' })
        .select()
        .single();

    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    return newLead!;
}

async function findOrCreateSession(supabase: ReturnType<typeof createServerClient>, leadId: string, demoId: string) {
    const { data: existing } = await supabase
        .from('sessions')
        .select('*')
        .eq('lead_id', leadId)
        .eq('demo_id', demoId)
        .eq('channel', 'voice')
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (existing) return existing;

    const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({ lead_id: leadId, demo_id: demoId, channel: 'voice' })
        .select()
        .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return newSession!;
}

async function loadLeadHistory(supabase: ReturnType<typeof createServerClient>, leadId: string) {
    const { data: sessions } = await supabase.from('sessions').select('id').eq('lead_id', leadId);
    if (!sessions?.length) return [];

    const sessionIds = sessions.map(s => s.id);
    const { data: messages } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .in('session_id', sessionIds)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true });

    if (!messages) return [];
    return messages.slice(-50).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`twilio-voice:${ip}`, CHAT_LIMIT);
    if (!allowed) {
        return new NextResponse(twiml(say('Rate limit exceeded. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }

    const body: Record<string, string> = {};
    try {
        const formData = await request.formData();
        for (const [k, v] of formData.entries()) {
            if (typeof v === 'string') body[k] = v;
        }
    } catch {
        return new NextResponse(twiml(say('Sorry. Goodbye.')), { headers: { 'Content-Type': 'text/xml' }, status: 400 });
    }

    const digits = (body.Digits || body.digits || '').trim();
    const from = body.From || body.from || '';

    if (!digits || digits.length !== 8) {
        return new NextResponse(
            twiml(say('Invalid code. Please call back and enter your 8 digit demo code. Goodbye.')),
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }

    const supabase = createServerClient();

    const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('voice_short_code', digits)
        .single();

    if (demoError || !demo || demo.status !== 'active') {
        return new NextResponse(
            twiml(say('Demo not found. Please check your code and try again. Goodbye.')),
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }

    if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
        return new NextResponse(twiml(say('This demo has expired. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }

    try {
        const lead = await findOrCreateLead(supabase, demo.id, from);
        const session = await findOrCreateSession(supabase, lead.id, demo.id);
        const history = await loadLeadHistory(supabase, lead.id);

        const saveMessageFn = async (
            sid: string,
            role: 'user' | 'assistant',
            content: string,
            tokenCount: number
        ) => {
            await supabase.from('messages').insert({ session_id: sid, role, content, token_count: tokenCount });
        };

        const { content } = await processMessageSync({
            demo,
            leadIdentifier: from,
            message: 'The caller just connected and entered the demo code.',
            history,
            channel: 'voice',
            sessionId: session.id,
            saveMessageFn,
        });

        return new NextResponse(
            twiml(gatherSpeech(demo.id, session.id, content || 'How can I help you today?')),
            { headers: { 'Content-Type': 'text/xml' } }
        );
    } catch (err) {
        console.error('Twilio voice gather error:', err);
        return new NextResponse(twiml(say('Sorry, something went wrong. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
            status: 500,
        });
    }
}
