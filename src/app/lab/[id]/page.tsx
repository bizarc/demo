'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DemoBuilder, DemoFormData, demoRowToFormData } from '../DemoBuilder';

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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-canvas)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid var(--color-border)',
                        borderTopColor: 'var(--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 12px',
                    }} />
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading draft...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-canvas)',
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--color-error-bg)',
                        color: 'var(--color-error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '24px',
                    }}>!</div>
                    <p style={{ color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                        {error}
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Redirecting to LAB...
                    </p>
                </div>
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
