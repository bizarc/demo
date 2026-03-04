'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const RESEARCH_TYPE_OPTIONS = [
    { value: 'company', skillKey: 'research.company.profile.v1', label: 'Company', inputLabel: 'Company name', inputPlaceholder: 'e.g. Acme Corp' },
    { value: 'industry', skillKey: 'research.industry.landscape.v1', label: 'Industry', inputLabel: 'Industry or vertical', inputPlaceholder: 'e.g. Roofing, SaaS' },
    { value: 'function', skillKey: 'research.function.v1', label: 'Function', inputLabel: 'Function or domain', inputPlaceholder: 'e.g. Customer Service, Finance, Sales' },
    { value: 'technology', skillKey: 'research.technology.v1', label: 'Technology', inputLabel: 'Platform or tool', inputPlaceholder: 'e.g. ServiceNow, Workday, Salesforce' },
];

const MISSION_OPTIONS = [
    { value: '', label: 'None (general research)' },
    { value: 'customer-service', label: 'Customer Service' },
    { value: 'inbound-nurture', label: 'Inbound Nurture / Sales' },
    { value: 'database-reactivation', label: 'Database Reactivation' },
    { value: 'review-generation', label: 'Review Generation' },
];

export default function NewResearchPage() {
    const router = useRouter();
    const [researchType, setResearchType] = useState<'company' | 'industry' | 'function' | 'technology'>('company');
    const [targetInput, setTargetInput] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [industry, setIndustry] = useState('');
    const [missionProfile, setMissionProfile] = useState('');
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentType = RESEARCH_TYPE_OPTIONS.find((o) => o.value === researchType) ?? RESEARCH_TYPE_OPTIONS[0];

    const handleRunResearch = async () => {
        const target = targetInput.trim();
        if (!target) {
            setError(`${currentType.inputLabel} is required`);
            return;
        }
        setRunning(true);
        setError(null);
        try {
            const res = await fetch('/api/recon/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillKey: currentType.skillKey,
                    executionMode: 'assist',
                    input: {
                        companyName: researchType === 'company' ? target : undefined,
                        target: target,
                        websiteUrl: websiteUrl.trim() || undefined,
                        industry: industry.trim() || undefined,
                        missionProfile: missionProfile || undefined,
                    },
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Research failed');
            const outputAssetId = data.outputAssetId;
            if (outputAssetId) {
                router.push(`/recon/research/${outputAssetId}`);
            } else if (data.runId) {
                setError('Research ran but no record was saved. Check RECON migrations or skill runtime.');
            } else {
                setError(data.errorMessage || 'Research failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Research failed');
        } finally {
            setRunning(false);
        }
    };

    return (
        <InternalAppShell title="RECON" subtitle="New AI Research">
            <main className="mx-auto max-w-3xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/recon/research">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={14} className="mr-1" /> Back
                            </Button>
                        </Link>
                        <h2 className="text-2xl font-semibold text-foreground">New AI Research</h2>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRunResearch}
                        disabled={running || !targetInput.trim()}
                    >
                        <Search size={14} className="mr-1" />
                        {running ? 'Running...' : 'Run research'}
                    </Button>
                </div>

                <p className="mb-6 text-sm text-foreground-secondary">
                    Run Perplexity-backed research by skill type. Results are saved as a draft research record you can
                    review and reuse in THE LAB or RADAR.
                </p>

                {error && (
                    <div className="mb-6 rounded-md bg-error-bg p-4 text-sm text-error-text">
                        {error}
                    </div>
                )}

                <Card variant="default" padding="lg">
                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Research type</label>
                            <select
                                value={researchType}
                                onChange={(e) => setResearchType(e.target.value as 'company' | 'industry' | 'function' | 'technology')}
                                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                {RESEARCH_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                                {currentType.inputLabel} <span className="text-error">*</span>
                            </label>
                            <Input
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value)}
                                placeholder={currentType.inputPlaceholder}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Website URL</label>
                            <Input
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Industry</label>
                            <Input
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="e.g. Auto repair, SaaS"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Mission profile</label>
                            <select
                                value={missionProfile}
                                onChange={(e) => setMissionProfile(e.target.value)}
                                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                {MISSION_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-foreground-muted">
                                Optional. Shapes the context block for a specific agent type.
                            </p>
                        </div>
                    </div>
                </Card>
            </main>
        </InternalAppShell>
    );
}
