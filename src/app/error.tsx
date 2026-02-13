'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Route error:', error);
    }, [error]);

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                background: 'var(--color-canvas)',
                fontFamily: 'var(--font-sans)',
            }}
        >
            <div
                style={{
                    maxWidth: 480,
                    textAlign: 'center',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 32,
                }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'var(--color-error-bg)',
                        color: 'var(--color-error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}
                >
                    <svg
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1
                    style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        marginBottom: 8,
                    }}
                >
                    Something went wrong
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 24,
                    }}
                >
                    An unexpected error occurred. Please try again.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={reset}
                        style={{
                            background: 'var(--color-primary)',
                            color: 'var(--color-text-inverse)',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Try again
                    </button>
                    <Link
                        href="/lab"
                        style={{
                            display: 'inline-block',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 14,
                            fontWeight: 500,
                            textDecoration: 'none',
                        }}
                    >
                        Back to LAB
                    </Link>
                </div>
            </div>
        </div>
    );
}
