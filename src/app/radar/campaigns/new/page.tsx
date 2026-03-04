'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KnowledgeBaseSelect } from '@/components/ui/KnowledgeBaseSelect';

const STEPS = ['Campaign', 'RECON Link', 'Sender Identity', 'Schedule'];

export default function NewCampaignPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        outreach_goal: '',
        target_niche: '',
        channel: 'email',
        research_record_id: '',
        knowledge_base_id: '',
        from_name: '',
        from_email: '',
        reply_to_email: '',
        send_time_hour: 9,
        timezone: 'America/New_York',
        daily_send_limit: 200,
    });

    const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleCreate = async () => {
        if (!form.name.trim()) { setError('Campaign name required'); return; }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/radar/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create campaign');
            router.push(`/radar/campaigns/${data.campaign.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create');
            setSaving(false);
        }
    };

    return (
        <InternalAppShell title="RADAR — New Campaign" subtitle="Set up a new outreach campaign">
            <main className="mx-auto max-w-2xl px-6 py-10">
                <div className="mb-6">
                    <Link href="/radar/campaigns" className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground">
                        <ArrowLeft size={14} /> Back to Campaigns
                    </Link>
                </div>

                <h2 className="mb-6 text-2xl font-semibold text-foreground">New Campaign</h2>

                {/* Step indicator */}
                <div className="mb-8 flex items-center gap-2">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                                i < step ? 'bg-primary text-white' :
                                i === step ? 'border-2 border-primary text-primary' :
                                'border border-border text-foreground-secondary'
                            }`}>
                                {i < step ? <Check size={12} /> : i + 1}
                            </div>
                            <span className={`text-sm ${i === step ? 'font-medium text-foreground' : 'text-foreground-secondary'}`}>{s}</span>
                            {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
                        </div>
                    ))}
                </div>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                <Card variant="default" padding="lg">
                    {/* Step 0: Campaign basics */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Campaign Name *</label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder="Austin Roofers Q2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Outreach Goal</label>
                                <Input
                                    value={form.outreach_goal}
                                    onChange={(e) => set('outreach_goal', e.target.value)}
                                    placeholder="Invite to a free demo, Check if interested in growth, Follow up after site visit…"
                                />
                                <p className="mt-1 text-xs text-foreground-secondary">
                                    Describes what you want recipients to do. Used to personalize AI-generated emails.
                                </p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Target Niche (optional)</label>
                                <Input
                                    value={form.target_niche}
                                    onChange={(e) => set('target_niche', e.target.value)}
                                    placeholder="Roofing contractors, Dentists, HVAC companies…"
                                />
                                <p className="mt-1 text-xs text-foreground-secondary">
                                    Helps AI use industry-relevant language.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: RECON Link */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-foreground-secondary">
                                Optionally link a RECON research record and knowledge base to power personalization.
                                Both are optional but improve AI-generated email quality.
                            </p>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Research Record ID (optional)</label>
                                <Input
                                    value={form.research_record_id}
                                    onChange={(e) => set('research_record_id', e.target.value)}
                                    placeholder="UUID from RECON"
                                />
                                <p className="mt-1 text-xs text-foreground-secondary">
                                    Find IDs in <Link href="/recon/research" className="text-primary hover:underline">RECON → Research</Link>
                                </p>
                            </div>
                            <div>
                                <KnowledgeBaseSelect
                                    label="Knowledge Base (optional)"
                                    value={form.knowledge_base_id}
                                    onChange={(v) => set('knowledge_base_id', v)}
                                    statusFilter="approved"
                                />
                                <p className="mt-1 text-xs text-foreground-secondary">
                                    <Link href="/recon/kb" className="text-primary hover:underline">RECON → Knowledge Bases</Link> to create or manage.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Sender Identity */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">From Name *</label>
                                <Input
                                    value={form.from_name}
                                    onChange={(e) => set('from_name', e.target.value)}
                                    placeholder="Jane from Acme"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">From Email *</label>
                                <Input
                                    type="email"
                                    value={form.from_email}
                                    onChange={(e) => set('from_email', e.target.value)}
                                    placeholder="jane@acme.com"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Reply-To Email (optional)</label>
                                <Input
                                    type="email"
                                    value={form.reply_to_email}
                                    onChange={(e) => set('reply_to_email', e.target.value)}
                                    placeholder="replies@acme.com"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Send Time (hour, 0–23)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={form.send_time_hour}
                                    onChange={(e) => set('send_time_hour', parseInt(e.target.value) || 9)}
                                />
                                <p className="mt-1 text-xs text-foreground-secondary">
                                    Cron runs every 5 minutes — this is a target hour guideline.
                                </p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Timezone</label>
                                <Input
                                    value={form.timezone}
                                    onChange={(e) => set('timezone', e.target.value)}
                                    placeholder="America/New_York"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Daily Send Limit</label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={2000}
                                    value={form.daily_send_limit}
                                    onChange={(e) => set('daily_send_limit', parseInt(e.target.value) || 200)}
                                />
                            </div>
                            <div className="rounded-lg bg-canvas-secondary p-4">
                                <p className="mb-2 text-sm font-medium text-foreground">Review</p>
                                <dl className="space-y-1 text-xs text-foreground-secondary">
                                    <div><dt className="inline font-medium">Name:</dt> <dd className="inline">{form.name}</dd></div>
                                    {form.outreach_goal && (
                                        <div><dt className="inline font-medium">Goal:</dt> <dd className="inline">{form.outreach_goal}</dd></div>
                                    )}
                                    {form.target_niche && (
                                        <div><dt className="inline font-medium">Niche:</dt> <dd className="inline">{form.target_niche}</dd></div>
                                    )}
                                    <div><dt className="inline font-medium">From:</dt> <dd className="inline">{form.from_name} &lt;{form.from_email}&gt;</dd></div>
                                    <div><dt className="inline font-medium">Limit:</dt> <dd className="inline">{form.daily_send_limit}/day</dd></div>
                                </dl>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-between">
                        <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
                            <ArrowLeft size={14} className="mr-1" /> Back
                        </Button>
                        {step < STEPS.length - 1 ? (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    if (step === 0 && !form.name.trim()) { setError('Campaign name required'); return; }
                                    setError(null);
                                    setStep(step + 1);
                                }}
                            >
                                Next <ArrowRight size={14} className="ml-1" />
                            </Button>
                        ) : (
                            <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
                                {saving ? 'Creating…' : 'Create Campaign'}
                            </Button>
                        )}
                    </div>
                </Card>
            </main>
        </InternalAppShell>
    );
}
