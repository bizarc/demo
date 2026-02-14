'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MissionStep } from './steps/MissionStep';
import { WebsiteStep } from './steps/WebsiteStep';
import { ContextStep } from './steps/ContextStep';
import { KnowledgeBaseStep } from './steps/KnowledgeBaseStep';
import { ModelStep } from './steps/ModelStep';
import { SummaryStep } from './steps/SummaryStep';
import { ChatPreview } from './ChatPreview';
import { MissionProfile, Channel } from '@/lib/prompts';
import { ScrapeResult } from '@/lib/scraper';
import { useAutosave } from '@/lib/useAutosave';
import { trackUxEvent } from '@/lib/uxMetrics';
import styles from './builder.module.css';

export interface DemoFormData {
    missionProfile: MissionProfile | null;
    channel: Channel;
    websiteUrl: string;
    scrapeResult: ScrapeResult | null;
    companyName: string;
    industry: string;
    productsServices: string;
    offers: string;
    qualificationCriteria: string;
    logoUrl: string;
    primaryColor: string;
    knowledgeBaseId: string | null;
    knowledgeBaseDocuments: { id: string; filename: string; chunk_count: number }[];
    model: string;
    systemPrompt: string;
}

export const STEPS = [
    { id: 'mission', label: 'Mission Profile', num: 1 },
    { id: 'website', label: 'Target Website', num: 2 },
    { id: 'context', label: 'Context', num: 3 },
    { id: 'knowledge', label: 'Knowledge Base', num: 4 },
    { id: 'model', label: 'Model', num: 5 },
    { id: 'summary', label: 'Create', num: 6 },
];

export const INITIAL_FORM_DATA: DemoFormData = {
    missionProfile: null,
    channel: 'website',
    websiteUrl: '',
    scrapeResult: null,
    companyName: '',
    industry: '',
    productsServices: '',
    offers: '',
    qualificationCriteria: '',
    logoUrl: '',
    primaryColor: '#2563EB',
    knowledgeBaseId: null,
    knowledgeBaseDocuments: [],
    model: 'openai/gpt-4o-mini',
    systemPrompt: '',
};

interface DemoBuilderProps {
    /** If provided, resume from an existing draft */
    initialDraftId?: string | null;
    /** If provided, pre-populate form data from the draft */
    initialFormData?: DemoFormData;
    /** If provided, start at this step */
    initialStep?: string;
    /** Version for optimistic locking when resuming a draft */
    initialVersion?: number;
}

// Map DB mission_profile enum to full profile ID
const DB_TO_PROFILE: Record<string, MissionProfile> = {
    reactivation: 'database-reactivation',
    nurture: 'inbound-nurture',
    service: 'customer-service',
    review: 'review-generation',
};

// Reverse: full profile ID to DB enum
export const PROFILE_TO_DB: Record<MissionProfile, string> = {
    'database-reactivation': 'reactivation',
    'inbound-nurture': 'nurture',
    'customer-service': 'service',
    'review-generation': 'review',
};

/**
 * Convert a DB demo row into DemoFormData for the builder.
 */
export function demoRowToFormData(demo: Record<string, unknown>): DemoFormData {
    const missionProfile = demo.mission_profile
        ? DB_TO_PROFILE[demo.mission_profile as string] || null
        : null;

    const channel = (demo.channel as Channel) || 'website';
    return {
        missionProfile,
        channel: ['sms', 'messenger', 'email', 'website', 'voice'].includes(channel) ? channel : 'website',
        websiteUrl: (demo.website_url as string) || '',
        scrapeResult: null, // Not stored in DB
        companyName: (demo.company_name as string) || '',
        industry: (demo.industry as string) || '',
        productsServices: Array.isArray(demo.products_services)
            ? (demo.products_services as string[]).join(', ')
            : '',
        offers: Array.isArray(demo.offers)
            ? (demo.offers as string[]).join(', ')
            : '',
        qualificationCriteria: Array.isArray(demo.qualification_criteria)
            ? (demo.qualification_criteria as string[]).join(', ')
            : '',
        logoUrl: (demo.logo_url as string) || '',
        primaryColor: (demo.primary_color as string) || '#2563EB',
        knowledgeBaseId: (demo.knowledge_base_id as string) || null,
        knowledgeBaseDocuments: [],
        model: (demo.openrouter_model as string) || 'openai/gpt-4o-mini',
        systemPrompt: (demo.system_prompt as string) || '',
    };
}

export function DemoBuilder({ initialDraftId, initialFormData, initialStep, initialVersion }: DemoBuilderProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(initialStep || 'mission');
    const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
        // If resuming, mark all steps before the current step as completed
        if (initialStep) {
            const idx = STEPS.findIndex(s => s.id === initialStep);
            return STEPS.slice(0, idx).map(s => s.id);
        }
        return [];
    });
    const [formData, setFormData] = useState<DemoFormData>(initialFormData || INITIAL_FORM_DATA);

    const {
        draftId,
        saving,
        lastSavedAt,
        error: autosaveError,
        createDraft,
        saveNow,
        saveDraft,
        activate,
    } = useAutosave({ initialDraftId, initialVersion });

    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    const updateFormData = useCallback((updates: Partial<DemoFormData>) => {
        setFormData(prev => {
            const next = { ...prev, ...updates };
            // Trigger debounced autosave on field change
            saveDraft(next, currentStep);
            return next;
        });
    }, [currentStep, saveDraft]);

    const goToStep = (stepId: string) => {
        const targetIndex = STEPS.findIndex(s => s.id === stepId);
        if (completedSteps.includes(stepId) || targetIndex <= currentIndex) {
            setCurrentStep(stepId);
        }
    };

    const nextStep = useCallback(async () => {
        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep]);
        }

        const nextStepId = currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1].id : currentStep;

        // Create draft after step 1 if it doesn't exist yet
        if (currentStep === 'mission' && !draftId) {
            const newId = await createDraft(formData, nextStepId);
            if (newId) {
                // Update the URL to include the draft ID without full navigation
                window.history.replaceState(null, '', `/lab/${newId}`);
            }
        } else if (draftId) {
            // Immediate save on step change
            saveNow(formData, nextStepId);
        }

        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(nextStepId);
            trackUxEvent('builder_step_advanced', {
                fromStep: currentStep,
                toStep: nextStepId,
                stepIndex: currentIndex + 1,
            });
        }
    }, [completedSteps, currentStep, currentIndex, draftId, formData, createDraft, saveNow]);

    const prevStep = () => {
        if (currentIndex > 0) {
            const prevStepId = STEPS[currentIndex - 1].id;
            setCurrentStep(prevStepId);
            trackUxEvent('builder_step_back', {
                fromStep: currentStep,
                toStep: prevStepId,
            });
            if (draftId) {
                saveNow(formData, prevStepId);
            }
        }
    };

    const handleActivate = useCallback(async () => {
        const result = await activate(formData);
        if (result) {
            trackUxEvent('builder_demo_activated', {
                draftId: result.id,
                channel: formData.channel,
                missionProfile: formData.missionProfile,
            });
            router.push(`/lab/success?id=${result.id}`);
        } else {
            trackUxEvent('builder_activation_failed', {
                channel: formData.channel,
                missionProfile: formData.missionProfile,
            });
        }
        return result;
    }, [activate, formData, router]);

    // Update URL when draft is first created (for /lab/new flow)
    useEffect(() => {
        if (draftId && !initialDraftId && window.location.pathname === '/lab/new') {
            window.history.replaceState(null, '', `/lab/${draftId}`);
        }
    }, [draftId, initialDraftId]);

    const renderStep = () => {
        switch (currentStep) {
            case 'mission':
                return (
                    <MissionStep
                        selected={formData.missionProfile}
                        channel={formData.channel}
                        onSelect={(profile: MissionProfile) => updateFormData({ missionProfile: profile })}
                        onChannelSelect={(ch) => updateFormData({ channel: ch })}
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
                                qualificationCriteria: result.qualifications?.join(', ') || '',
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
            case 'knowledge':
                return (
                    <KnowledgeBaseStep
                        draftId={draftId}
                        knowledgeBaseId={formData.knowledgeBaseId}
                        documents={formData.knowledgeBaseDocuments}
                        onUpdate={(u) => updateFormData({
                            ...(u.knowledgeBaseId !== undefined && { knowledgeBaseId: u.knowledgeBaseId }),
                            ...(u.documents !== undefined && { knowledgeBaseDocuments: u.documents }),
                        })}
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
                        onActivate={handleActivate}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.layout}>
            {/* Mobile: Step indicator bar (hidden on desktop via CSS) */}
            <div className={styles.mobileHeader}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Step {currentIndex + 1} of {STEPS.length}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {STEPS[currentIndex]?.label}
                </span>
                {/* Step dots */}
                <div style={{ display: 'flex', gap: '6px' }}>
                    {STEPS.map((step, idx) => (
                        <div
                            key={step.id}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: idx === currentIndex
                                    ? 'var(--color-primary)'
                                    : completedSteps.includes(step.id)
                                        ? 'var(--color-success)'
                                        : 'var(--color-border)',
                                transition: 'background 150ms',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Left: Step Indicator Sidebar */}
            <div className={styles.sidebar}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Create demo
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Build your AI agent
                    </p>
                </div>

                {/* Step Indicator */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
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

                {/* Autosave Status */}
                <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--color-border)',
                }}>
                    {autosaveError ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-error)' }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: 'var(--color-error)', display: 'inline-block',
                            }} />
                            Save failed, retrying...
                        </span>
                    ) : saving ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: 'var(--color-warning)', display: 'inline-block',
                            }} />
                            Saving...
                        </span>
                    ) : lastSavedAt ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: 'var(--color-success)', display: 'inline-block',
                            }} />
                            Draft saved
                        </span>
                    ) : draftId ? (
                        <span>Draft</span>
                    ) : null}
                </div>
            </div>

            {/* Center: Configuration Form */}
            <div className={styles.center}>
                <div className={styles.centerInner}>
                    <Link
                        href="/lab"
                        className="mb-6 flex items-center text-sm text-foreground-muted transition-colors hover:text-foreground-secondary"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to demos
                    </Link>
                    {renderStep()}
                </div>
            </div>

            {/* Right: Live Chat Preview */}
            <div className={styles.preview}>
                {currentStep === 'summary' && draftId ? (
                    <ChatPreview demoId={draftId} formData={formData} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Live preview</h3>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                Available on the final step
                            </p>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Chat preview</p>
                                <p style={{ fontSize: '13px', lineHeight: 1.5 }}>
                                    Complete all steps to preview your agent
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
