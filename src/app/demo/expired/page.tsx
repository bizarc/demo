import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ExpiredDemoPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
            <Card variant="default" padding="lg" className="w-full max-w-md text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg text-error">
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
                <h1 className="mb-2 text-xl font-semibold text-foreground">
                    Demo expired
                </h1>
                <p className="mb-6 text-sm text-foreground-secondary">
                    This demo link has expired. Demo links are valid for 7 days. Please
                    contact the person who shared this link to get a new one.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/lab">
                        <Button variant="primary" size="md">Go to Lab</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="md">Home</Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
