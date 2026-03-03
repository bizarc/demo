/**
 * RADAR outreach prompt builder.
 * Builds personalized email content by composing:
 *   1. Base system prompt (mission × channel) from prompts.ts
 *   2. Prospect context injection
 *   3. RECON research summary
 *   4. KB retrieval via RAG
 *   5. Step-specific ai_instructions
 */

import { buildSystemPrompt, type MissionProfile } from './prompts';
import { retrieve } from './retrieval';

export interface OutreachPromptContext {
    missionProfile: MissionProfile;
    // Prospect fields
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    title?: string | null;
    industry?: string | null;
    // Sender
    senderName?: string | null;
    // RECON
    researchSummary?: string | null;
    // KB
    knowledgeBaseId?: string | null;
    // Step
    aiInstructions?: string | null;
    stepNumber?: number;
    // Unsubscribe URL injected into template
    unsubscribeUrl?: string;
}

export interface GeneratedOutreach {
    subject: string;
    body: string;
}

/** Build the full system prompt for outreach generation */
export async function buildOutreachPrompt(ctx: OutreachPromptContext): Promise<string> {
    const prospectName = [ctx.firstName, ctx.lastName].filter(Boolean).join(' ') || 'there';
    const company = ctx.companyName || 'their company';

    // Retrieve KB context if available
    let kbContext = '';
    if (ctx.knowledgeBaseId) {
        const query = `${ctx.missionProfile} outreach to ${company} ${ctx.title || ''} ${ctx.industry || ''}`.trim();
        try {
            kbContext = await retrieve(ctx.knowledgeBaseId, query);
        } catch {
            // Non-fatal: proceed without KB context
        }
    }

    const base = buildSystemPrompt(
        ctx.missionProfile,
        {
            companyName: company,
            industry: ctx.industry,
            agentContext: ctx.researchSummary || undefined,
            knowledgeBaseContext: kbContext || undefined,
        },
        'email'
    );

    const parts = [base];

    parts.push(`\n[OUTREACH CONTEXT]
You are composing a cold outreach email.
Prospect name: ${prospectName}
Company: ${company}
Title: ${ctx.title || 'Unknown'}
Step: ${ctx.stepNumber ?? 1}
Sender: ${ctx.senderName || 'The team'}`);

    if (ctx.aiInstructions) {
        parts.push(`\n[STEP INSTRUCTIONS]\n${ctx.aiInstructions}`);
    }

    parts.push(`\n[OUTPUT FORMAT]
Return ONLY a JSON object with exactly two fields:
{
  "subject": "<email subject line>",
  "body": "<full HTML email body>"
}
- The body should be clean HTML suitable for email clients
- Include the unsubscribe link as: <a href="${ctx.unsubscribeUrl || '{{unsubscribe_url}}'}">Unsubscribe</a>
- Keep the body under 200 words
- Do not include any explanation outside the JSON`);

    return parts.join('\n');
}

/** Build a 1×1 transparent GIF tracking pixel HTML */
export function buildTrackingPixelHtml(trackingId: string, appUrl: string): string {
    const url = `${appUrl}/api/radar/track/open/${encodeURIComponent(trackingId)}`;
    return `<img src="${url}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />`;
}

/** Wrap all href links in body for click tracking */
export function injectTrackingLinks(body: string, trackingId: string, appUrl: string): string {
    const baseUrl = `${appUrl}/api/radar/track/click/${encodeURIComponent(trackingId)}`;
    return body.replace(/href="(https?:\/\/[^"]+)"/g, (_, url) => {
        const encoded = encodeURIComponent(url);
        return `href="${baseUrl}?url=${encoded}"`;
    });
}

/** Generate a cryptographically random tracking ID */
export function generateTrackingId(): string {
    return crypto.randomUUID();
}

/** Generate a HMAC-signed unsubscribe token */
export async function generateUnsubscribeToken(
    prospectId: string,
    enrollmentId: string
): Promise<string> {
    const secret = process.env.RADAR_UNSUBSCRIBE_SECRET;
    if (!secret) throw new Error('RADAR_UNSUBSCRIBE_SECRET not configured');

    const payload = JSON.stringify({ prospectId, enrollmentId, iat: Date.now() });
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    const payloadBase64 = btoa(payload);

    return `${payloadBase64}.${sigBase64}`;
}

/** Verify and decode an unsubscribe token */
export async function verifyUnsubscribeToken(
    token: string
): Promise<{ prospectId: string; enrollmentId: string } | null> {
    const secret = process.env.RADAR_UNSUBSCRIBE_SECRET;
    if (!secret) return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    try {
        const [payloadBase64, sigBase64] = parts;
        const payload = atob(payloadBase64);
        const encoder = new TextEncoder();

        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const sigBytes = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
        if (!valid) return null;

        const data = JSON.parse(payload);
        return { prospectId: data.prospectId, enrollmentId: data.enrollmentId };
    } catch {
        return null;
    }
}

/** Replace template variables in subject/body */
export function applyTemplateVariables(
    template: string,
    vars: {
        firstName?: string | null;
        lastName?: string | null;
        companyName?: string | null;
        title?: string | null;
        senderName?: string | null;
        unsubscribeUrl?: string | null;
    }
): string {
    return template
        .replace(/\{\{first_name\}\}/g, vars.firstName || '')
        .replace(/\{\{last_name\}\}/g, vars.lastName || '')
        .replace(/\{\{company_name\}\}/g, vars.companyName || '')
        .replace(/\{\{title\}\}/g, vars.title || '')
        .replace(/\{\{sender_name\}\}/g, vars.senderName || '')
        .replace(/\{\{unsubscribe_url\}\}/g, vars.unsubscribeUrl || '#');
}
