'use client';

import { useState } from 'react';
import { MissionStep } from './steps/MissionStep';
import { WebsiteStep } from './steps/WebsiteStep';
import { ContextStep } from './steps/ContextStep';
import { ModelStep } from './steps/ModelStep';
import { SummaryStep } from './steps/SummaryStep';
import { ChatPreview } from './ChatPreview';
import { MissionProfile } from '@/lib/prompts';
import { ScrapeResult } from '@/lib/scraper';

export interface DemoFormData {
    missionProfile: MissionProfile | null;
    websiteUrl: string;
    scrapeResult: ScrapeResult | null;
    companyName: string;
    industry: string;
    productsServices: string;
    offers: string;
    qualificationCriteria: string;
    logoUrl: string;
    primaryColor: string;
    model: string;
    systemPrompt: string;
}

const STEPS = [
    { id: 'mission', label: 'Mission Profile', num: 1 },
    { id: 'website', label: 'Target Website', num: 2 },
    { id: 'context', label: 'Context', num: 3 },
    { id: 'model', label: 'Model', num: 4 },
    { id: 'summary', label: 'Create', num: 5 },
];

const INITIAL_FORM_DATA: DemoFormData = {
    missionProfile: null,
    websiteUrl: '',
    scrapeResult: null,
    companyName: '',
    industry: '',
    productsServices: '',
    offers: '',
    qualificationCriteria: '',
    logoUrl: '',
    primaryColor: '#2563EB',
    model: 'openai/gpt-4o-mini',
    systemPrompt: '',
};

export function DemoBuilder() {
    const [currentStep, setCurrentStep] = useState('mission');
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [formData, setFormData] = useState<DemoFormData>(INITIAL_FORM_DATA);

    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    const updateFormData = (updates: Partial<DemoFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const goToStep = (stepId: string) => {
        const targetIndex = STEPS.findIndex(s => s.id === stepId);
        // Only allow navigating to completed steps or the next available
        if (completedSteps.includes(stepId) || targetIndex <= currentIndex) {
            setCurrentStep(stepId);
        }
    };

    const nextStep = () => {
        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep]);
        }
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1].id);
        }
    };

    const prevStep = () => {
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'mission':
                return (
                    <MissionStep
                        selected={formData.missionProfile}
                        onSelect={(profile: MissionProfile) => updateFormData({ missionProfile: profile })}
                        onNext={nextStep}
                    />
                );
            case 'website':
                return (
                    <WebsiteStep
                        url={formData.websiteUrl}
                        scrapeResult={formData.scrapeResult}
                        onUrlChange={(url: string) => updateFormData({ websiteUrl: url })}
                        onScrapeComplete={(result: ScrapeResult) => {
                            updateFormData({
                                scrapeResult: result,
                                companyName: result.companyName,
                                industry: result.industry || '',
                                productsServices: result.products.join(', '),
                                offers: result.offers.join(', '),
                                logoUrl: result.logoUrl || '',
                                primaryColor: result.primaryColor || '#2563EB',
                            });
                        }}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                );
            case 'context':
                return (
                    <ContextStep
                        formData={formData}
                        onUpdate={updateFormData}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                );
            case 'model':
                return (
                    <ModelStep
                        selected={formData.model}
                        onSelect={(model: string) => updateFormData({ model })}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                );
            case 'summary':
                return (
                    <SummaryStep
                        formData={formData}
                        onBack={prevStep}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-canvas)' }}>
            {/* Left: Step Indicator Sidebar */}
            <div style={{
                width: '240px',
                background: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
                padding: '24px',
                flexShrink: 0,
            }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Create demo
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Build your AI agent
                    </p>
                </div>

                {/* Step Indicator */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {STEPS.map((step, idx) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = completedSteps.includes(step.id);
                        const isPast = idx < currentIndex;

                        return (
                            <button
                                key={step.id}
                                onClick={() => goToStep(step.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: isActive ? '#EFF6FF' : 'transparent',
                                    cursor: (isCompleted || isPast) ? 'pointer' : 'default',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'background 150ms',
                                }}
                            >
                                {/* Step Number/Check */}
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    background: isActive ? 'var(--color-primary)' :
                                        isCompleted ? 'var(--color-success)' : 'var(--color-border-subtle)',
                                    color: (isActive || isCompleted) ? '#FFFFFF' : 'var(--color-text-muted)',
                                    border: isActive ? 'none' :
                                        isCompleted ? 'none' : '1px solid var(--color-border)',
                                }}>
                                    {isCompleted ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : step.num}
                                </div>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: isActive ? 500 : 400,
                                    color: isActive ? 'var(--color-primary)' :
                                        isCompleted ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                }}>
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Center: Configuration Form */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
                    {renderStep()}
                </div>
            </div>

            {/* Right: Live Chat Preview */}
            <div style={{
                width: '384px',
                background: 'var(--color-surface)',
                borderLeft: '1px solid var(--color-border)',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
            }}>
                <ChatPreview key={formData.missionProfile || 'none'} formData={formData} />
            </div>
        </div>
    );
}
