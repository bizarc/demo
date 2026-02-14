'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { SkeletonSuccessCard } from '@/components/ui/Skeleton';

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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-canvas)',
                padding: '40px 20px',
            }}>
                <SkeletonSuccessCard />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-canvas)',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            <div className="success-card" style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '40px',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
            }}>
                {/* Success Icon */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </div>

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    marginBottom: '8px'
                }}>
                    Demo Ready!
                </h1>

                <p style={{
                    color: 'var(--color-text-secondary)',
                    marginBottom: '32px'
                }}>
                    Your AI demo for <strong>{demo?.company_name}</strong> has been generated successfully.
                </p>

                {/* SMS instructions when channel is sms */}
                {demo?.channel === 'sms' && demo?.sms_short_code && (
                    <div style={{
                        background: '#EFF6FF',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'left',
                        border: '1px solid #DBEAFE',
                    }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                            SMS Demo
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            Share with your prospect: Text <strong>START-{demo.sms_short_code}</strong> to your Twilio number to start the conversation.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            Configure your Twilio SMS webhook to: <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{typeof window !== 'undefined' ? `${window.location.origin}/api/twilio/sms` : '/api/twilio/sms'}</code>
                        </p>
                    </div>
                )}

                {/* Email instructions when channel is email */}
                {demo?.channel === 'email' && demo?.email_short_code && (
                    <div style={{
                        background: '#FFF8E1',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'left',
                        border: '1px solid #FFE082',
                    }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B', marginBottom: '8px' }}>
                            Email Demo
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            Share with your prospect: Email <strong>start-{demo.email_short_code}@your-inbound-domain.com</strong> to start the conversation.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            Configure SendGrid Inbound Parse webhook to: <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{typeof window !== 'undefined' ? `${window.location.origin}/api/sendgrid/inbound` : '/api/sendgrid/inbound'}</code>
                        </p>
                    </div>
                )}

                {/* WhatsApp instructions when channel is messenger */}
                {demo?.channel === 'messenger' && demo?.whatsapp_short_code && (
                    <div style={{
                        background: '#E8F5E9',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'left',
                        border: '1px solid #C8E6C9',
                    }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-success)', marginBottom: '8px' }}>
                            WhatsApp Demo
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            Share with your prospect: Send <strong>START-{demo.whatsapp_short_code}</strong> to your WhatsApp Business number to start the conversation.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            Configure your Twilio WhatsApp webhook to: <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{typeof window !== 'undefined' ? `${window.location.origin}/api/twilio/whatsapp` : '/api/twilio/whatsapp'}</code>
                        </p>
                    </div>
                )}

                {/* Voice instructions when channel is voice */}
                {demo?.channel === 'voice' && demo?.voice_short_code && (
                    <div style={{
                        background: '#F3E8FF',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'left',
                        border: '1px solid #E9D5FF',
                    }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED', marginBottom: '8px' }}>
                            Voice Demo
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            Share with your prospect: Call your Twilio number and enter <strong>{demo.voice_short_code}</strong> when prompted.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            Configure your Twilio Voice webhook to: <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{typeof window !== 'undefined' ? `${window.location.origin}/api/twilio/voice` : '/api/twilio/voice'}</code>
                        </p>
                    </div>
                )}

                {/* Magic Link Box */}
                <div style={{
                    background: 'var(--color-canvas)',
                    borderRadius: '12px',
                    padding: '6px 6px 6px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '32px',
                    border: '1px solid var(--color-border)',
                }}>
                    <div style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        marginRight: '12px',
                        textAlign: 'left',
                    }}>
                        {magicLink}
                    </div>
                    <button
                        onClick={handleCopy}
                        style={{
                            background: copied ? 'var(--color-success)' : '#FFFFFF',
                            color: copied ? '#FFFFFF' : 'var(--color-text-primary)',
                            border: copied ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 500,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="success-content-grid" style={{ display: 'flex', gap: '40px', justifyContent: 'center', alignItems: 'flex-start' }}>
                    {/* QR Code */}
                    {qrCodeData && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                padding: '16px',
                                background: '#FFFFFF',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                marginBottom: '12px',
                                display: 'inline-block',
                            }}>
                                <OptimizedImage src={qrCodeData} alt="Demo QR Code" width={160} height={160} />
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Scan to test on mobile</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px', paddingTop: '16px' }}>
                        <a
                            href={magicLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: 'var(--color-primary)',
                                color: '#FFFFFF',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            Open Demo
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </a>

                        <Link
                            href="/lab/new"
                            style={{
                                display: 'block',
                                color: 'var(--color-text-secondary)',
                                padding: '12px 24px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                fontSize: '14px',
                            }}
                        >
                            Create another demo
                        </Link>
                        <Link
                            href="/lab"
                            style={{
                                display: 'block',
                                color: 'var(--color-text-muted)',
                                padding: '4px 24px',
                                textDecoration: 'none',
                                fontSize: '13px',
                            }}
                        >
                            Back to LAB
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-canvas)',
                padding: '40px 20px',
            }}>
                <SkeletonSuccessCard />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
