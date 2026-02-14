import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
            <Card variant="default" padding="lg" className="w-full max-w-md text-center">
                <div className="mb-4 text-6xl font-semibold leading-none text-foreground-muted">
                    404
                </div>
                <h1 className="mb-2 text-2xl font-semibold text-foreground">
                    Page not found
                </h1>
                <p className="mb-6 text-sm text-foreground-secondary">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link href="/lab">
                    <Button variant="primary" size="md">Back to Lab</Button>
                </Link>
            </Card>
        </div>
    );
}
