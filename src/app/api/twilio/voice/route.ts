/**
 * Twilio Voice webhook. Handles inbound calls and voice interactions.
 * Configure in Twilio: Phone Numbers -> Voice URL -> POST to this route.
 *
 * Flow:
 * 1. Call connects -> prompt for 8-digit demo code (DTMF)
 * 2. User enters code -> find demo, create session, play AI welcome
 * 3. <Gather input="speech"> for ongoing conversation
 *
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, NEXT_PUBLIC_APP_URL
 */

import { NextRequest, NextResponse } from 'next/server';
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

function gatherDigits(action: string, prompt: string): string {
    return say(prompt) + `<Gather numDigits="8" action="${action}" method="POST" timeout="10"/>`;
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`twilio-voice:${ip}`, CHAT_LIMIT);
    if (!allowed) {
        return new NextResponse(twiml(say('Rate limit exceeded. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return new NextResponse(twiml(say('Service temporarily unavailable. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
            status: 503,
        });
    }

    const body: Record<string, string> = {};
    try {
        const formData = await request.formData();
        for (const [k, v] of formData.entries()) {
            if (typeof v === 'string') body[k] = v;
        }
    } catch {
        return new NextResponse(twiml(say('Sorry, we could not process your request. Goodbye.')), {
            headers: { 'Content-Type': 'text/xml' },
            status: 400,
        });
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
    const gatherUrl = `${base.replace(/\/$/, '')}/api/twilio/voice/gather`;

    return new NextResponse(
        twiml(gatherDigits(gatherUrl, 'Welcome. Please enter your 8 digit demo code using your keypad.')),
        { headers: { 'Content-Type': 'text/xml' } }
    );
}
