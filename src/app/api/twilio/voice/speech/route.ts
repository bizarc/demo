/**
 * Twilio Voice: handles speech input for ongoing conversation.
 * Redirected from <Gather input="speech"> in gather route.
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

    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get('demoId');
    const sessionId = searchParams.get('sessionId');

    if (!demoId || !sessionId) {
        return new NextResponse(twiml(say('Session expired. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
            status: 400,
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

    const speechResult = (body.SpeechResult || body.speech_result || '').trim();

    if (!speechResult) {
        return new NextResponse(
            twiml(gatherSpeech(demoId, sessionId, 'I did not catch that. What would you like to know?')),
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }

    const supabase = createServerClient();

    const { data: demo, error: demoError } = await supabase.from('demos').select('*').eq('id', demoId).single();

    if (demoError || !demo) {
        return new NextResponse(twiml(say('Demo not found. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }

    const { data: session } = await supabase.from('sessions').select('lead_id').eq('id', sessionId).single();
    const { data: lead } = session
        ? await supabase.from('leads').select('identifier').eq('id', session.lead_id).single()
        : { data: null };

    if (!session || !lead) {
        return new NextResponse(twiml(say('Session not found. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }

    const history = await loadLeadHistory(supabase, session.lead_id);

    const saveMessageFn = async (
        sid: string,
        role: 'user' | 'assistant',
        content: string,
        tokenCount: number
    ) => {
        await supabase.from('messages').insert({ session_id: sid, role, content, token_count: tokenCount });
    };

    try {
        await saveMessageFn(sessionId, 'user', speechResult, 0);

        const { content } = await processMessageSync({
            demo,
            leadIdentifier: lead.identifier,
            message: speechResult,
            history,
            channel: 'voice',
            sessionId,
            saveMessageFn,
        });

        return new NextResponse(
            twiml(gatherSpeech(demoId, sessionId, content || 'Anything else?')),
            { headers: { 'Content-Type': 'text/xml' } }
        );
    } catch (err) {
        console.error('Twilio voice speech error:', err);
        return new NextResponse(
            twiml(gatherSpeech(demoId, sessionId, 'Sorry, I had trouble with that. What else can I help with?')),
            { headers: { 'Content-Type': 'text/xml' }, status: 500 }
        );
    }
}
