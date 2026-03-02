'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MISSION_OPTIONS = [
    { value: '', label: 'None (general research)' },
    { value: 'customer-service', label: 'Customer Service' },
    { value: 'inbound-nurture', label: 'Inbound Nurture / Sales' },
    { value: 'database-reactivation', label: 'Database Reactivation' },
    { value: 'review-generation', label: 'Review Generation' },
];

export default function NewResearchPage() {
    const router = useRouter();
    const [companyName, setCompanyName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [industry, setIndustry] = useState('');
    const [missionProfile, setMissionProfile] = useState('');
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunResearch = async () => {
        const company = companyName.trim();
        if (!company) {
            setError('Company name is required');
            return;
        }
        setRunning(true);
        setError(null);
        try {
            const res = await fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: company,
                    websiteUrl: websiteUrl.trim() || undefined,
                    industry: industry.trim() || undefined,
                    missionProfile: missionProfile || undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Research failed');
            const record = data.record;
            if (record?.id) {
                router.push(`/recon/research/${record.id}`);
            } else {
                setError('Research ran but no record was saved. Check RECON migrations.');
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
                        disabled={running || !companyName.trim()}
                    >
                        <Search size={14} className="mr-1" />
                        {running ? 'Running...' : 'Run research'}
                    </Button>
                </div>

                <p className="mb-6 text-sm text-foreground-secondary">
                    Run Perplexity-backed research for a company. Results are saved as a draft research record you can
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
                            <label className="mb-2 block text-sm font-medium text-foreground">
                                Company name <span className="text-error">*</span>
                            </label>
                            <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Acme Corp"
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
