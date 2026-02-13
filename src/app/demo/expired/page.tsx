import Link from 'next/link';

export default function ExpiredDemoPage() {
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
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
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
                    Demo expired
                </h1>
                <p
                    style={{
                        fontSize: 14,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 24,
                    }}
                >
                    This demo link has expired. Demo links are valid for 7 days. Please
                    contact the person who shared this link to get a new one.
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
                    Go to LAB
                </Link>
            </div>
        </div>
    );
}
