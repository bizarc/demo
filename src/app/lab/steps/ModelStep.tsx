'use client';

import { AVAILABLE_MODELS } from '@/lib/openrouter';

interface ModelStepProps {
    selected: string;
    onSelect: (model: string) => void;
    onNext: () => void;
    onBack: () => void;
}

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

export function ModelStep({ selected, onSelect, onNext, onBack }: ModelStepProps) {
    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Select AI model
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Choose the model that powers your agent
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {AVAILABLE_MODELS.map((model) => {
                    const isSelected = selected === model.id;
                    return (
                        <button
                            key={model.id}
                            onClick={() => onSelect(model.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--color-surface)',
                                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                borderLeft: isSelected ? '4px solid var(--color-primary)' : undefined,
                                borderRadius: '8px',
                                padding: '16px 20px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'border-color 150ms',
                                width: '100%',
                            }}
                        >
                            <div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: 'var(--color-text-primary)',
                                    marginBottom: '4px',
                                }}>
                                    {model.name}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: 'var(--color-text-secondary)',
                                }}>
                                    {model.id}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                                <div style={{
                                    fontSize: '13px',
                                    color: 'var(--color-text-primary)',
                                    fontFamily: 'var(--font-mono)',
                                }}>
                                    ${model.pricing.prompt}/M in
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--color-text-muted)',
                                }}>
                                    {(model.contextLength / 1000).toFixed(0)}K context
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <button
                    onClick={onNext}
                    style={{ ...btnBase, background: 'var(--color-primary)', color: '#FFFFFF' }}
                >
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
}
