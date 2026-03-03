/**
 * RADAR SendGrid extension for outreach email sending.
 * Wraps the base sendgrid.ts with HTML body, tracking pixel,
 * List-Unsubscribe header, and webhook correlation.
 */

import sgMail from '@sendgrid/mail';
import { initSendGrid, isSendGridConfigured } from './sendgrid';

export interface OutreachEmailParams {
    to: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    // Tracking & correlation
    campaignId: string;
    enrollmentId: string;
    trackingId: string;
    // Threading (for follow-up steps)
    inReplyTo?: string;
    references?: string;
    // Unsubscribe
    unsubscribeUrl: string;
}

export interface OutreachEmailResult {
    messageId: string;
}

/** Send an outreach email with tracking and compliance headers */
export async function sendOutreachEmail(params: OutreachEmailParams): Promise<OutreachEmailResult> {
    if (!isSendGridConfigured()) {
        throw new Error('SendGrid not configured');
    }
    initSendGrid();

    const headers: Record<string, string> = {
        'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Campaign-Id': params.campaignId,
        'X-Enrollment-Id': params.enrollmentId,
        'X-Tracking-Id': params.trackingId,
    };

    if (params.inReplyTo) {
        headers['In-Reply-To'] = params.inReplyTo;
        headers['References'] = params.references || params.inReplyTo;
    }

    const msg: sgMail.MailDataRequired = {
        to: params.to,
        from: { name: params.fromName, email: params.fromEmail },
        replyTo: params.replyTo || params.fromEmail,
        subject: params.subject,
        html: params.htmlBody,
        text: params.textBody || stripHtml(params.htmlBody),
        headers,
        // Custom args for SendGrid Event Webhook correlation
        customArgs: {
            campaign_id: params.campaignId,
            enrollment_id: params.enrollmentId,
            tracking_id: params.trackingId,
        },
        trackingSettings: {
            // Disable SendGrid's built-in open/click tracking — use our own pixel
            openTracking: { enable: false },
            clickTracking: { enable: false },
        },
    };

    const [response] = await (sgMail as any).send(msg);
    const messageId = response?.headers?.['x-message-id'] || params.trackingId;
    return { messageId };
}

/** Verify SendGrid Event Webhook HMAC-SHA256 signature */
export async function verifyEventWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string
): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    const data = encoder.encode(timestamp + payload);
    const sigBytes = base64ToBytes(signature);

    return crypto.subtle.verify('HMAC', key, sigBytes, data);
}

function base64ToBytes(base64: string): Uint8Array {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}

function stripHtml(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
