'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { TopNav } from '@/components/ui/TopNav';
import { Spinner } from '@/components/ui/Spinner';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }

            router.push(redirect);
            router.refresh();
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-canvas">
            <TopNav title="Funnel Finished" subtitle="Sign in to continue" />

            <main className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-16">
                <Card variant="default" padding="lg" className="w-full">
                    <h1 className="mb-2 text-2xl font-semibold text-foreground">
                        Sign in
                    </h1>
                    <p className="mb-6 text-sm text-foreground-secondary">
                        Enter your credentials to access THE LAB and internal tools.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {error && (
                            <p className="text-sm text-error" role="alert">
                                {error}
                            </p>
                        )}
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            loading={loading}
                            disabled={loading}
                        >
                            Sign in
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-foreground-muted">
                        <Link href="/" className="text-primary hover:underline">
                            Back to home
                        </Link>
                    </p>
                </Card>
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
