'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
            <Card variant="default" padding="lg" className="w-full max-w-lg text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg text-error">
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
                <h1 className="mb-2 text-xl font-semibold text-foreground">
                    Something went wrong
                </h1>
                <p className="mb-6 text-sm text-foreground-secondary">
                    An unexpected error occurred. Please try again.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button type="button" variant="primary" size="md" onClick={reset}>
                        Try again
                    </Button>
                    <Link href="/lab">
                        <Button variant="secondary" size="md">Back to Lab</Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
