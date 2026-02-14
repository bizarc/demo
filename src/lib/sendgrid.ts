/**
 * SendGrid client for sending transactional emails.
 * Used by the Email channel to reply to inbound messages.
 */

import sgMail from '@sendgrid/mail';

export function initSendGrid(): void {
    const key = process.env.SENDGRID_API_KEY;
    if (key) {
        sgMail.setApiKey(key);
    }
}

export function isSendGridConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
}

export interface SendEmailParams {
    to: string;
    from: string;
    subject: string;
    text: string;
    replyTo?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
    if (!isSendGridConfigured()) {
        throw new Error('SendGrid not configured');
    }
    initSendGrid();
    await sgMail.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text,
        replyTo: params.replyTo,
    });
}
