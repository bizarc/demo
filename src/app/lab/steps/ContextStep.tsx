'use client';

import { useState } from 'react';
import { DemoFormData } from '../DemoBuilder';

interface ContextStepProps {
    formData: DemoFormData;
    onUpdate: (updates: Partial<DemoFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface ResearchEnrichment {
    summary: string;
    competitors: string[];
    context_block: string;
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    outline: 'none',
    color: 'var(--color-text-primary)',
    boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    fontFamily: 'inherit',
};

const helperStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
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

// No list merging needed for context block

export function ContextStep({ formData, onUpdate, onNext, onBack }: ContextStepProps) {
    const [researchLoading, setResearchLoading] = useState(false);
    const [researchError, setResearchError] = useState<string | null>(null);
    const canContinue = formData.companyName.trim().length > 0;

    const runResearch = async () => {
        if (!formData.companyName.trim()) return;
        setResearchLoading(true);
        setResearchError(null);
        try {
            const res = await fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: formData.companyName,
                    websiteUrl: formData.websiteUrl || undefined,
                    industry: formData.industry || undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Research failed');
            const { enrichment } = data as { enrichment?: ResearchEnrichment };
            if (enrichment) {
                const newContext = [formData.agentContext, enrichment.context_block]
                    .filter(Boolean)
                    .join('\n\n--- AI Enrichment ---\n\n');

                onUpdate({
                    agentContext: newContext,
                });
            }
        } catch (e) {
            setResearchError(e instanceof Error ? e.message : 'Research failed');
        } finally {
            setResearchLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                {formData.missionProfile === 'customer-service' ? 'Customize your support agent'
                    : formData.missionProfile === 'inbound-nurture' ? 'Customize your sales assistant'
                        : formData.missionProfile === 'database-reactivation' ? 'Customize your reactivation agent'
                            : 'Review company context'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Edit the information below to guide your AI agent's conversations
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div>
                    <label style={labelStyle}>Company name</label>
                    <input
                        style={inputStyle}
                        value={formData.companyName}
                        onChange={(e) => onUpdate({ companyName: e.target.value })}
                        placeholder="Acme Inc."
                    />
                </div>

                <div>
                    <label style={labelStyle}>Industry</label>
                    <input
                        style={inputStyle}
                        value={formData.industry}
                        onChange={(e) => onUpdate({ industry: e.target.value })}
                        placeholder="Technology, Healthcare, etc."
                    />
                </div>

                <div style={{ marginBottom: '8px' }}>
                    <button
                        type="button"
                        onClick={runResearch}
                        disabled={researchLoading || !formData.companyName.trim()}
                        style={{
                            ...btnBase,
                            background: 'var(--color-primary)',
                            color: '#FFFFFF',
                            opacity: researchLoading || !formData.companyName.trim() ? 0.6 : 1,
                            cursor: researchLoading || !formData.companyName.trim() ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {researchLoading ? (
                            <>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                Researching…
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                Run AI Research
                            </>
                        )}
                    </button>
                    <p style={helperStyle}>Uses Perplexity to enrich context from company name and website</p>
                    {researchError && <p style={{ ...helperStyle, color: 'var(--color-error, #EF4444)', marginTop: '4px' }}>{researchError}</p>}
                </div>

                <div>
                    <label style={labelStyle}>Agent Context</label>
                    <textarea
                        style={textareaStyle}
                        value={formData.agentContext}
                        onChange={(e) => onUpdate({ agentContext: e.target.value })}
                        placeholder="Describe what the agent needs to know. The AI Research button will refine this."
                        rows={10}
                    />
                    <p style={helperStyle}>Mission-specific context block for the agent prompt.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>Logo URL</label>
                        <input
                            style={inputStyle}
                            value={formData.logoUrl}
                            onChange={(e) => onUpdate({ logoUrl: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Brand color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                                style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: 0 }}
                            />
                            <input
                                style={{ ...inputStyle, flex: 1 }}
                                value={formData.primaryColor}
                                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                                placeholder="#2563EB"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    style={{
                        ...btnBase,
                        background: 'var(--color-primary)',
                        color: '#FFFFFF',
                        opacity: canContinue ? 1 : 0.5,
                        cursor: canContinue ? 'pointer' : 'not-allowed',
                    }}
                >
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
}
