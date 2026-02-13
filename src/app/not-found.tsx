import Link from 'next/link';

export default function NotFound() {
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
                    maxWidth: 420,
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 700,
                        color: 'var(--color-border)',
                        marginBottom: 16,
                        lineHeight: 1,
                    }}
                >
                    404
                </div>
                <h1
                    style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        marginBottom: 8,
                    }}
                >
                    Page not found
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 24,
                    }}
                >
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/lab"
                    style={{
                        display: 'inline-block',
                        background: 'var(--color-primary)',
                        color: 'var(--color-text-inverse)',
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
    );
}
