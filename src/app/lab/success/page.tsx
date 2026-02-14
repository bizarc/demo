'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { SkeletonSuccessCard } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ReactNode } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const demoId = searchParams.get('id');
    const magicLink = (typeof window !== 'undefined' && demoId)
        ? `${window.location.origin}/demo/${demoId}`
        : '';
    const [qrCodeData, setQrCodeData] = useState('');
    const [copied, setCopied] = useState(false);
    const [demo, setDemo] = useState<{ company_name?: string; channel?: string; sms_short_code?: string; whatsapp_short_code?: string; email_short_code?: string; voice_short_code?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!demoId) {
            router.push('/lab');
            return;
        }

        // Generate QR Code
        QRCode.toDataURL(magicLink, { width: 256, margin: 2 })
            .then(setQrCodeData)
            .catch(console.error);

        // Fetch demo details for preview
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        supabase
            .from('demos')
            .select('*')
            .eq('id', demoId)
            .single()
            .then(({ data }) => {
                if (data) setDemo(data);
                setLoading(false);
            });
    }, [demoId, magicLink, router]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(magicLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
                <SkeletonSuccessCard />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-5 py-10">
            <Card variant="default" padding="lg" className="rounded-lg p-8 text-center">
                {/* Success Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </div>

                <h1 className="mb-2 text-2xl font-semibold text-foreground">
                    Demo Ready!
                </h1>

                <p className="mb-8 text-foreground-secondary">
                    Your AI demo for <strong>{demo?.company_name}</strong> has been generated successfully.
                </p>

                {/* SMS instructions when channel is sms */}
                {demo?.channel === 'sms' && demo?.sms_short_code && (
                    <InstructionCard title="SMS demo" tone="primary">
                        <p className="mb-2 text-sm text-foreground-secondary">
                            Share with your prospect: Text <strong>START-{demo.sms_short_code}</strong> to your Twilio number to start the conversation.
                        </p>
                        <p className="text-xs text-foreground-muted">
                            Configure your Twilio SMS webhook to: <code className="rounded bg-border-subtle px-1.5 py-0.5 text-[11px]">{typeof window !== 'undefined' ? `${window.location.origin}/api/twilio/sms` : '/api/twilio/sms'}</code>
                        </p>
                    </InstructionCard>
                )}

                {/* Email instructions when channel is email */}
                {demo?.channel === 'email' && demo?.email_short_code && (
                    <InstructionCard title="Email demo" tone="warning">
                        <p className="mb-2 text-sm text-foreground-secondary">
                            Share with your prospect: Email <strong>start-{demo.email_short_code}@your-inbound-domain.com</strong> to start the conversation.
                        </p>
                        <p className="text-xs text-foreground-muted">
                            Configure SendGrid Inbound Parse webhook to: <code className="rounded bg-border-subtle px-1.5 py-0.5 text-[11px]">{typeof window !== 'undefined' ? `${window.location.origin}/api/sendgrid/inbound` : '/api/sendgrid/inbound'}</code>
                        </p>
                    </InstructionCard>
                )}

                {/* WhatsApp instructions when channel is messenger */}
                {demo?.channel === 'messenger' && demo?.whatsapp_short_code && (
                    <InstructionCard title="WhatsApp demo" tone="success">
                        <p className="mb-2 text-sm text-foreground-secondary">
                            Share with your prospect: Send <strong>START-{demo.whatsapp_short_code}</strong> to your WhatsApp Business number to start the conversation.
                        </p>
                        <p className="text-xs text-foreground-muted">
                            Configure your Twilio WhatsApp webhook to: <code className="rounded bg-border-subtle px-1.5 py-0.5 text-[11px]">{typeof window !== 'undefined' ? `${window.location.origin}/api/twilio/whatsapp` : '/api/twilio/whatsapp'}</code>
                        </p>
                    </InstructionCard>
                )}

                {/* Voice instructions when channel is voice */}
                {demo?.channel === 'voice' && demo?.voice_short_code && (
                    <InstructionCard title="Voice demo" tone="type">
                        <p className="mb-2 text-sm text-foreground-secondary">
                            Share with your prospect: Call your Twilio number and enter <strong>{demo.voice_short_code}</strong> when prompted.
                        </p>
                        <p className="text-xs text-foreground-muted">
                            Configure your Twilio Voice webhook to: <code className="rounded bg-border-subtle px-1.5 py-0.5 text-[11px]">{typeof window !== 'undefined' ? `${window.location.origin}/api/twilio/voice` : '/api/twilio/voice'}</code>
                        </p>
                    </InstructionCard>
                )}

                {/* Magic Link Box */}
                <div className="mb-8 flex items-center rounded-lg border border-border bg-canvas p-1.5 pl-4">
                    <div className="mr-3 flex-1 overflow-hidden text-left font-mono text-sm text-foreground">
                        {magicLink}
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                            copied
                                ? 'border-success bg-success text-white'
                                : 'border-border bg-surface text-foreground hover:bg-border-subtle'
                        }`}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-start md:justify-center">
                    {/* QR Code */}
                    {qrCodeData && (
                        <div className="text-center">
                            <div className="mb-3 inline-block rounded-lg border border-border bg-surface p-4">
                                <OptimizedImage src={qrCodeData} alt="Demo QR Code" width={160} height={160} />
                            </div>
                            <p className="text-sm text-foreground-secondary">Scan to test on mobile</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex min-w-[220px] flex-col gap-3 md:pt-4">
                        <a
                            href={magicLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            Open Demo
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </a>

                        <Link href="/lab/new">
                            <Button variant="secondary" size="md" className="w-full">
                                Create another demo
                            </Button>
                        </Link>
                        <Link
                            href="/lab"
                            className="block px-6 py-1 text-sm text-foreground-secondary transition-colors hover:text-foreground"
                        >
                            Back to Lab
                        </Link>
                        <Link
                            href="/"
                            className="block px-6 py-1 text-sm text-foreground-secondary transition-colors hover:text-foreground"
                        >
                            Home
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
                <SkeletonSuccessCard />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}

function InstructionCard({
    title,
    tone,
    children,
}: {
    title: string;
    tone: 'primary' | 'warning' | 'success' | 'type';
    children: ReactNode;
}) {
    const toneClass =
        tone === 'primary'
            ? 'border-primary-subtle bg-primary-highlight'
            : tone === 'warning'
                ? 'border-border bg-canvas'
                : tone === 'success'
                    ? 'border-border bg-canvas'
                    : 'border-primary-subtle bg-primary-subtle';

    return (
        <div className={`mb-6 rounded-lg border p-4 text-left ${toneClass}`}>
            <div className="mb-2">
                <Badge variant={tone === 'success' ? 'live' : 'draft'} size="sm">
                    {title}
                </Badge>
            </div>
            {children}
        </div>
    );
}
