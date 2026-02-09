'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DemoFormData } from '../DemoBuilder';
import { MISSION_PROFILES } from '@/lib/prompts';
import { AVAILABLE_MODELS } from '@/lib/openrouter';
import { RotateCcw, Sprout, Headset, Star, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = { RotateCcw, Sprout, Headset, Star };

interface SummaryStepProps {
    formData: DemoFormData;
    onBack: () => void;
}

const rowStyle: React.CSSProperties = {
    display: 'flex',
    padding: '10px 0',
    borderBottom: '1px solid var(--color-border-subtle)',
    fontSize: '14px',
};

const labelCol: React.CSSProperties = {
    width: '140px',
    flexShrink: 0,
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
};

const valueCol: React.CSSProperties = {
    color: 'var(--color-text-primary)',
    flex: 1,
};

const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms',
};

export function SummaryStep({ formData, onBack }: SummaryStepProps) {
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const missionProfile = formData.missionProfile
        ? MISSION_PROFILES[formData.missionProfile]
        : null;

    const selectedModel = AVAILABLE_MODELS.find(m => m.id === formData.model);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        try {
            const response = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mission_profile: formData.missionProfile,
                    company_name: formData.companyName,
                    industry: formData.industry,
                    website_url: formData.websiteUrl,
                    products_services: formData.productsServices,
                    offers: formData.offers,
                    qualification_criteria: formData.qualificationCriteria,
                    logo_url: formData.logoUrl,
                    primary_color: formData.primaryColor,
                    openrouter_model: formData.model,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create demo');
            router.push(`/demo/${data.id}/success`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create demo');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Review &amp; create
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Confirm your demo configuration
            </p>

            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
            }}>
                {/* Logo + Company Header */}
                {(formData.logoUrl || formData.companyName) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                        {formData.logoUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={formData.logoUrl} alt="Logo" style={{ height: '40px', width: 'auto', borderRadius: '6px' }} />
                        )}
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {formData.companyName}
                            </div>
                            {formData.industry && (
                                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{formData.industry}</div>
                            )}
                        </div>
                    </div>
                )}

                <div style={rowStyle}>
                    <div style={labelCol}>Mission</div>
                    <div style={valueCol}>
                        {missionProfile ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {(() => { const Icon = ICON_MAP[missionProfile.icon]; return Icon ? <Icon size={16} strokeWidth={1.75} /> : null; })()}
                                {missionProfile.name}
                            </span>
                        ) : '—'}
                    </div>
                </div>
                <div style={rowStyle}>
                    <div style={labelCol}>Website</div>
                    <div style={valueCol}>{formData.websiteUrl || '—'}</div>
                </div>
                <div style={rowStyle}>
                    <div style={labelCol}>Products</div>
                    <div style={valueCol}>{formData.productsServices || '—'}</div>
                </div>
                <div style={rowStyle}>
                    <div style={labelCol}>Offers</div>
                    <div style={valueCol}>{formData.offers || '—'}</div>
                </div>
                <div style={rowStyle}>
                    <div style={labelCol}>Model</div>
                    <div style={valueCol}>{selectedModel?.name || formData.model}</div>
                </div>
                <div style={{ ...rowStyle, borderBottom: 'none' }}>
                    <div style={labelCol}>Brand color</div>
                    <div style={{ ...valueCol, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: formData.primaryColor, border: '1px solid var(--color-border)' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formData.primaryColor}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '14px',
                    marginBottom: '24px',
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    style={{
                        ...btnBase,
                        background: 'var(--color-success)',
                        color: '#FFFFFF',
                        opacity: creating ? 0.7 : 1,
                        cursor: creating ? 'not-allowed' : 'pointer',
                        padding: '12px 28px',
                        fontSize: '15px',
                    }}
                >
                    {creating ? 'Creating...' : 'Create demo'}
                    {!creating && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
}
