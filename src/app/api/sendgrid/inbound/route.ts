/**
 * SendGrid Inbound Parse webhook. Receives inbound emails and responds with AI.
 * Configure in SendGrid: Settings -> Inbound Parse -> Add Host & URL.
 *
 * Flow:
 * 1. Prospect emails start-{short_code}@your-inbound-domain.com
 * 2. We extract short_code from the "to" address local part
 * 3. Find/create lead by sender email
 * 4. Process message through chat engine with channel 'email'
 * 5. Send reply via SendGrid
 *
 * Env: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (verified sender)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processMessageSync } from '@/lib/chatEngine';
import { sendEmail, isSendGridConfigured } from '@/lib/sendgrid';
import { getClientIp, checkRateLimit, CHAT_LIMIT } from '@/lib/rateLimit';

function extractEmail(from: string): string {
    const match = from.match(/<([^>]+)>/);
    if (match) return match[1].trim().toLowerCase();
    return from.trim().toLowerCase();
}

function extractShortCodeFromTo(to: string): string | null {
    const localPart = to.split('@')[0]?.toLowerCase() || '';
    const startMatch = localPart.match(/^start[-_]?(\w{6,12})$/);
    if (startMatch) return startMatch[1];
    if (/^\w{6,12}$/.test(localPart)) return localPart;
    return null;
}

async function findOrCreateLead(
    supabase: ReturnType<typeof createServerClient>,
    demoId: string,
    email: string
) {
    const { data: existing } = await supabase
        .from('leads')
        .select('*')
        .eq('demo_id', demoId)
        .eq('identifier', email)
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
            identifier: email,
            identifier_type: 'email',
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
        .eq('channel', 'email')
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
            channel: 'email',
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
    const { allowed } = checkRateLimit(`sendgrid-inbound:${ip}`, CHAT_LIMIT);
    if (!allowed) {
        return new NextResponse('Rate limit exceeded', { status: 429 });
    }

    const body: Record<string, string> = {};
    try {
        const formData = await request.formData();
        for (const [k, v] of formData.entries()) {
            if (typeof v === 'string') body[k] = v;
        }
    } catch {
        return new NextResponse('Bad Request', { status: 400 });
    }

    const fromRaw = body.from || body.From || '';
    const toRaw = body.to || body.To || '';
    const subject = (body.subject || body.Subject || '').trim();
    const textBody = (body.text || body.Text || '').trim();
    const htmlBody = (body.html || body.Html || '').trim();
    const msgBody = textBody || (htmlBody ? htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');

    const fromEmail = extractEmail(fromRaw);
    const shortCode = extractShortCodeFromTo(toRaw);

    if (!fromEmail || !msgBody) {
        return new NextResponse('OK', { status: 200 });
    }

    if (!shortCode) {
        return new NextResponse('OK', { status: 200 });
    }

    const supabase = createServerClient();

    const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('email_short_code', shortCode)
        .single();

    if (demoError || !demo || demo.status !== 'active') {
        return new NextResponse('OK', { status: 200 });
    }

    if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
        return new NextResponse('OK', { status: 200 });
    }

    if (!isSendGridConfigured()) {
        console.error('SendGrid not configured for email replies');
        return new NextResponse('OK', { status: 200 });
    }

    try {
        const lead = await findOrCreateLead(supabase, demo.id, fromEmail);
        const session = await findOrCreateSession(supabase, lead.id, demo.id);
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
            leadIdentifier: fromEmail,
            message: msgBody,
            history,
            channel: 'email',
            sessionId: session.id,
            saveMessageFn,
        });

        const fromAddr = process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM || 'noreply@example.com';
        const replySubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Demo'}`;

        await sendEmail({
            to: fromEmail,
            from: fromAddr,
            subject: replySubject,
            text: content,
        });

        return new NextResponse('OK', { status: 200 });
    } catch (err) {
        console.error('SendGrid inbound error:', err);
        return new NextResponse('OK', { status: 200 });
    }
}
