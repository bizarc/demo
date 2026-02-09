'use client';

import { DemoFormData } from '../DemoBuilder';

interface ContextStepProps {
    formData: DemoFormData;
    onUpdate: (updates: Partial<DemoFormData>) => void;
    onNext: () => void;
    onBack: () => void;
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

export function ContextStep({ formData, onUpdate, onNext, onBack }: ContextStepProps) {
    const canContinue = formData.companyName.trim().length > 0;

    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Review company context
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Edit the extracted information to customize your AI agent
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

                <div>
                    <label style={labelStyle}>Products &amp; services</label>
                    <textarea
                        style={textareaStyle}
                        value={formData.productsServices}
                        onChange={(e) => onUpdate({ productsServices: e.target.value })}
                        placeholder="Describe the main products or services..."
                        rows={3}
                    />
                    <p style={helperStyle}>Separate multiple items with commas</p>
                </div>

                <div>
                    <label style={labelStyle}>Special offers</label>
                    <textarea
                        style={textareaStyle}
                        value={formData.offers}
                        onChange={(e) => onUpdate({ offers: e.target.value })}
                        placeholder="Current promotions, discounts, or special deals..."
                        rows={2}
                    />
                    <p style={helperStyle}>Leave blank if none</p>
                </div>

                <div>
                    <label style={labelStyle}>Qualification criteria</label>
                    <textarea
                        style={textareaStyle}
                        value={formData.qualificationCriteria}
                        onChange={(e) => onUpdate({ qualificationCriteria: e.target.value })}
                        placeholder="What makes a lead qualified? Budget, timeline, decision-maker..."
                        rows={2}
                    />
                    <p style={helperStyle}>Helps the AI identify good prospects</p>
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
