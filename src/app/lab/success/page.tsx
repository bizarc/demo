'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import Link from 'next/link';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const demoId = searchParams.get('id');
    const magicLink = (typeof window !== 'undefined' && demoId)
        ? `${window.location.origin}/demo/${demoId}`
        : '';
    const [qrCodeData, setQrCodeData] = useState('');
    const [copied, setCopied] = useState(false);
    const [demo, setDemo] = useState<{ company_name?: string } | null>(null);
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
                background: 'var(--color-canvas)'
            }}>
                <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
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
            <div style={{
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

                <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', alignItems: 'flex-start' }}>
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
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrCodeData} alt="Demo QR Code" width="160" height="160" />
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
                            href="/lab"
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
                background: 'var(--color-canvas)'
            }}>
                <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
