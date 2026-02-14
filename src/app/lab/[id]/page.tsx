'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DemoBuilder, DemoFormData, demoRowToFormData } from '../DemoBuilder';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export default function EditDemoPage() {
    const params = useParams();
    const router = useRouter();
    const demoId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initialFormData, setInitialFormData] = useState<DemoFormData | null>(null);
    const [initialStep, setInitialStep] = useState<string>('mission');
    const [initialVersion, setInitialVersion] = useState<number>(1);

    useEffect(() => {
        if (!demoId) {
            router.push('/lab');
            return;
        }

        async function loadDraft() {
            try {
                const res = await fetch(`/api/demo/${demoId}`);
                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Demo not found');
                        setTimeout(() => router.push('/lab'), 2000);
                        return;
                    }
                    throw new Error(data.error || 'Failed to load demo');
                }

                // If active demo, redirect to success page
                if (data.status === 'active') {
                    router.push(`/lab/success?id=${demoId}`);
                    return;
                }

                setInitialFormData(demoRowToFormData(data));
                setInitialStep(data.current_step || 'mission');
                setInitialVersion(typeof data.version === 'number' ? data.version : 1);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load demo');
            } finally {
                setLoading(false);
            }
        }

        loadDraft();
    }, [demoId, router]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center p-6">
                <Card variant="default" padding="lg" className="w-full max-w-md text-center">
                    <div className="mb-3 flex justify-center">
                        <Spinner size="lg" color="primary" />
                    </div>
                    <p className="text-sm text-foreground-secondary">Loading draft...</p>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center p-6">
                <Card variant="default" padding="lg" className="w-full max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg text-error">
                        !
                    </div>
                    <p className="mb-2 text-base font-medium text-foreground">
                        {error}
                    </p>
                    <p className="text-sm text-foreground-secondary">
                        Redirecting to Lab...
                    </p>
                </Card>
            </div>
        );
    }

    if (!initialFormData) return null;

    return (
        <DemoBuilder
            initialDraftId={demoId}
            initialFormData={initialFormData}
            initialStep={initialStep}
            initialVersion={initialVersion}
        />
    );
}
