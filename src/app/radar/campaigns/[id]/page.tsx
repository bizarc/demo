'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, Play, Pause, RotateCcw, Plus, Trash2,
    BarChart2, Users, Settings, List, Eye
} from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Tab = 'steps' | 'prospects' | 'analytics' | 'settings';

function statusBadgeVariant(status: string): 'live' | 'draft' | 'archived' | 'type' {
    switch (status) {
        case 'active': return 'live';
        case 'paused': return 'type';
        case 'completed': case 'archived': return 'archived';
        default: return 'draft';
    }
}

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [campaign, setCampaign] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('steps');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewProspectId, setPreviewProspectId] = useState('');
    const [previewResult, setPreviewResult] = useState<{ subject: string; body: string } | null>(null);
    const [previewStepId, setPreviewStepId] = useState<string | null>(null);

    const loadCampaign = useCallback(async () => {
        try {
            const [camRes, stepsRes] = await Promise.all([
                fetch(`/api/radar/campaigns/${id}`),
                fetch(`/api/radar/campaigns/${id}/steps`),
            ]);
            const camData = await camRes.json();
            const stepsData = await stepsRes.json();
            setCampaign(camData.campaign);
            setSteps(stepsData.steps || []);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    useEffect(() => {
        Promise.all([loadCampaign()]).finally(() => setLoading(false));
    }, [loadCampaign]);

    useEffect(() => {
        if (tab === 'prospects') {
            fetch(`/api/radar/campaigns/${id}/enrollments?limit=50`)
                .then((r) => r.json())
                .then((d) => setEnrollments(d.enrollments || []))
                .catch(console.error);
        }
        if (tab === 'analytics') {
            fetch(`/api/radar/campaigns/${id}/analytics`)
                .then((r) => r.json())
                .then(setAnalytics)
                .catch(console.error);
        }
    }, [tab, id]);

    const doAction = async (action: 'activate' | 'pause' | 'resume') => {
        setActionLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/radar/campaigns/${id}/${action}`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `${action} failed`);
            setCampaign(data.campaign);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const addStep = async () => {
        const res = await fetch(`/api/radar/campaigns/${id}/steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: `Step ${steps.length + 1}`, delay_days: steps.length === 0 ? 0 : 3, use_ai: true }),
        });
        const data = await res.json();
        if (res.ok) setSteps((prev) => [...prev, data.step]);
    };

    const updateStep = async (stepId: string, updates: any) => {
        const res = await fetch(`/api/radar/campaigns/${id}/steps/${stepId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (res.ok) setSteps((prev) => prev.map((s) => s.id === stepId ? data.step : s));
    };

    const deleteStep = async (stepId: string) => {
        await fetch(`/api/radar/campaigns/${id}/steps/${stepId}`, { method: 'DELETE' });
        await loadCampaign();
    };

    const previewStep = async (stepId: string) => {
        if (!previewProspectId) { setError('Enter a prospect ID to preview'); return; }
        setPreviewStepId(stepId);
        setPreviewResult(null);
        try {
            const res = await fetch(`/api/radar/campaigns/${id}/steps/${stepId}/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospect_id: previewProspectId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Preview failed');
            setPreviewResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Preview failed');
        }
    };

    if (loading) {
        return (
            <InternalAppShell title="RADAR — Campaign">
                <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-foreground-secondary" /></div>
            </InternalAppShell>
        );
    }

    if (!campaign) {
        return (
            <InternalAppShell title="RADAR — Campaign">
                <main className="mx-auto max-w-2xl px-6 py-10">
                    <p className="text-sm text-foreground-secondary">Campaign not found.</p>
                    <Link href="/radar/campaigns"><Button variant="ghost" size="sm" className="mt-4">Back</Button></Link>
                </main>
            </InternalAppShell>
        );
    }

    return (
        <InternalAppShell title={`RADAR — ${campaign.name}`} subtitle="Campaign detail">
            <main className="mx-auto max-w-5xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/radar/campaigns" className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground">
                        <ArrowLeft size={14} /> Campaigns
                    </Link>
                    <div className="flex items-center gap-2">
                        <Badge variant={statusBadgeVariant(campaign.status)} size="sm">{campaign.status}</Badge>
                        {campaign.status === 'draft' || campaign.status === 'paused' ? (
                            <Button variant="primary" size="sm" onClick={() => doAction(campaign.status === 'paused' ? 'resume' : 'activate')} disabled={actionLoading}>
                                <Play size={14} className="mr-1" /> {campaign.status === 'paused' ? 'Resume' : 'Activate'}
                            </Button>
                        ) : null}
                        {campaign.status === 'active' && (
                            <Button variant="secondary" size="sm" onClick={() => doAction('pause')} disabled={actionLoading}>
                                <Pause size={14} className="mr-1" /> Pause
                            </Button>
                        )}
                    </div>
                </div>

                <h2 className="mb-1 text-2xl font-semibold text-foreground">{campaign.name}</h2>
                <p className="mb-6 text-sm text-foreground-secondary capitalize">
                    {campaign.mission_profile?.replace(/-/g, ' ')} · {campaign.channel} · {campaign.daily_send_limit}/day limit
                </p>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                {/* Tabs */}
                <div className="mb-6 flex gap-1 border-b border-border">
                    {(['steps', 'prospects', 'analytics', 'settings'] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                                tab === t ? 'border-b-2 border-primary text-primary' : 'text-foreground-secondary hover:text-foreground'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Steps Tab */}
                {tab === 'steps' && (
                    <div className="space-y-4">
                        {/* Preview prospect input */}
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Prospect ID for preview…"
                                value={previewProspectId}
                                onChange={(e) => setPreviewProspectId(e.target.value)}
                                className="max-w-xs"
                            />
                            <span className="text-xs text-foreground-secondary">Paste a prospect UUID to preview AI output per step</span>
                        </div>

                        {steps.length === 0 ? (
                            <Card variant="default" padding="lg">
                                <p className="text-sm text-foreground-secondary">No steps yet. Add a step to define the outreach sequence.</p>
                            </Card>
                        ) : (
                            steps.map((step, idx) => (
                                <Card key={step.id} variant="default" padding="lg">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">
                                            Step {step.step_number}: {step.name || `Step ${step.step_number}`}
                                        </span>
                                        <div className="flex gap-1">
                                            {previewProspectId && (
                                                <Button variant="ghost" size="sm" onClick={() => previewStep(step.id)}>
                                                    <Eye size={14} className="mr-1" /> Preview
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => deleteStep(step.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-foreground-secondary">Name</label>
                                                <Input
                                                    value={step.name || ''}
                                                    onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                                    placeholder={`Step ${step.step_number}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-foreground-secondary">Delay (days)</label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={step.delay_days}
                                                    onChange={(e) => updateStep(step.id, { delay_days: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-foreground-secondary">Subject Template</label>
                                            <Input
                                                value={step.subject_template || ''}
                                                onChange={(e) => updateStep(step.id, { subject_template: e.target.value })}
                                                placeholder="{{first_name}}, quick question about {{company_name}}"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-foreground-secondary">Body Template</label>
                                            <textarea
                                                className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                                                rows={4}
                                                value={step.body_template || ''}
                                                onChange={(e) => updateStep(step.id, { body_template: e.target.value })}
                                                placeholder="Hi {{first_name}}, I noticed…"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={step.use_ai}
                                                    onChange={(e) => updateStep(step.id, { use_ai: e.target.checked })}
                                                    className="h-4 w-4 rounded border-border"
                                                />
                                                <span className="text-xs font-medium text-foreground">Use AI generation</span>
                                            </label>
                                        </div>
                                        {step.use_ai && (
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-foreground-secondary">AI Instructions</label>
                                                <textarea
                                                    className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                                                    rows={2}
                                                    value={step.ai_instructions || ''}
                                                    onChange={(e) => updateStep(step.id, { ai_instructions: e.target.value })}
                                                    placeholder="Focus on their pain point around X. Keep under 100 words."
                                                />
                                            </div>
                                        )}

                                        {/* Preview result */}
                                        {previewStepId === step.id && previewResult && (
                                            <div className="rounded-lg border border-border bg-canvas-secondary p-3">
                                                <p className="mb-1 text-xs font-medium text-foreground">Preview</p>
                                                <p className="mb-2 text-sm font-medium text-foreground">{previewResult.subject}</p>
                                                <div className="text-xs text-foreground-secondary" dangerouslySetInnerHTML={{ __html: previewResult.body }} />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                        <Button variant="secondary" size="sm" onClick={addStep}>
                            <Plus size={14} className="mr-1" /> Add Step
                        </Button>
                    </div>
                )}

                {/* Prospects Tab */}
                {tab === 'prospects' && (
                    <div>
                        {enrollments.length === 0 ? (
                            <Card variant="default" padding="lg">
                                <p className="text-sm text-foreground-secondary">
                                    No prospects enrolled. Go to <Link href="/radar/prospects" className="text-primary hover:underline">Prospects</Link> and use bulk select to enroll.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                <p className="mb-2 text-sm text-foreground-secondary">{enrollments.length} enrolled</p>
                                {enrollments.map((e) => (
                                    <Card key={e.id} variant="default" padding="sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {(e.prospects as any)?.first_name} {(e.prospects as any)?.last_name || (e.prospects as any)?.email}
                                                </p>
                                                <p className="text-xs text-foreground-secondary">{(e.prospects as any)?.company_name} · Step {e.current_step}</p>
                                            </div>
                                            <Badge variant={e.status === 'active' ? 'live' : 'draft'} size="sm">{e.status}</Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {tab === 'analytics' && analytics && (
                    <div className="space-y-6">
                        {analytics.overview && (
                            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                {[
                                    { label: 'Sent', value: analytics.overview.total_sent },
                                    { label: 'Opened', value: analytics.overview.unique_opens },
                                    { label: 'Clicked', value: analytics.overview.unique_clicks },
                                    { label: 'Replied', value: analytics.overview.unique_replies },
                                    { label: 'Open Rate', value: `${analytics.overview.open_rate}%` },
                                    { label: 'Reply Rate', value: `${analytics.overview.reply_rate}%` },
                                ].map((stat) => (
                                    <Card key={stat.label} variant="default" padding="md">
                                        <p className="text-xs text-foreground-secondary">{stat.label}</p>
                                        <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value ?? '—'}</p>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {analytics.stepBreakdown && Object.keys(analytics.stepBreakdown).length > 0 && (
                            <div>
                                <h3 className="mb-3 text-base font-medium text-foreground">Per-Step Breakdown</h3>
                                <div className="overflow-x-auto rounded border border-border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-canvas-secondary">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-foreground-secondary">Step</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-foreground-secondary">Sent</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-foreground-secondary">Opened</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-foreground-secondary">Clicked</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-foreground-secondary">Replied</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(analytics.stepBreakdown).map(([step, counts]: [string, any]) => (
                                                <tr key={step} className="border-t border-border">
                                                    <td className="px-4 py-2 text-foreground">Step {step}</td>
                                                    <td className="px-4 py-2 text-foreground-secondary">{counts.sent || 0}</td>
                                                    <td className="px-4 py-2 text-foreground-secondary">{counts.opened || 0}</td>
                                                    <td className="px-4 py-2 text-foreground-secondary">{counts.clicked || 0}</td>
                                                    <td className="px-4 py-2 text-foreground-secondary">{counts.replied || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {analytics.sendsByDay && Object.keys(analytics.sendsByDay).length > 0 && (
                            <div>
                                <h3 className="mb-3 text-base font-medium text-foreground">Sends Per Day (Last 30 Days)</h3>
                                <div className="space-y-1">
                                    {Object.entries(analytics.sendsByDay).map(([day, count]) => (
                                        <div key={day} className="flex items-center gap-2 text-xs">
                                            <span className="w-24 text-foreground-secondary">{day}</span>
                                            <div className="h-4 rounded bg-primary" style={{ width: `${Math.min((count as number) * 4, 200)}px` }} />
                                            <span className="text-foreground-secondary">{count as number}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {tab === 'settings' && (
                    <Card variant="default" padding="lg">
                        <dl className="space-y-3 text-sm">
                            {[
                                { label: 'Campaign ID', value: campaign.id },
                                { label: 'Mission Profile', value: campaign.mission_profile },
                                { label: 'Channel', value: campaign.channel },
                                { label: 'From', value: `${campaign.from_name || ''} <${campaign.from_email || ''}>` },
                                { label: 'Reply-To', value: campaign.reply_to_email || '—' },
                                { label: 'Daily Limit', value: campaign.daily_send_limit },
                                { label: 'Timezone', value: campaign.timezone },
                                { label: 'Model', value: campaign.openrouter_model || 'default' },
                                { label: 'Research Record', value: campaign.research_record_id || '—' },
                                { label: 'Knowledge Base', value: campaign.knowledge_base_id || '—' },
                                { label: 'Created', value: new Date(campaign.created_at).toLocaleString() },
                                { label: 'Updated', value: new Date(campaign.updated_at).toLocaleString() },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex gap-4">
                                    <dt className="w-36 font-medium text-foreground-secondary">{label}</dt>
                                    <dd className="text-foreground">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </Card>
                )}
            </main>
        </InternalAppShell>
    );
}
