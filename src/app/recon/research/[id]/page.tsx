'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type ResearchType = 'company' | 'industry' | 'function' | 'technology';

interface ResearchRecord {
    id: string;
    title: string;
    summary: string;
    status: string;
    source: string;
    version: number;
    confidence_score: number | null;
    offerings: string[];
    tech_stack: string[];
    competitors: string[];
    market_position: string | null;
    research_type: ResearchType | null;
    skill_key: string | null;
    research_data: Record<string, unknown> | null;
    context_block: string | null;
    created_at: string;
    updated_at: string;
}

const VALID_STATUSES = ['draft', 'reviewed', 'approved', 'archived'];

function arrayToText(arr: string[] | null | undefined): string {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.filter(Boolean).join('\n');
}

function textToArray(text: string): string[] {
    return text
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
}

function getResearchDataArray(rd: Record<string, unknown>, key: string): string[] {
    const v = rd[key];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
function getResearchDataString(rd: Record<string, unknown>, key: string): string {
    const v = rd[key];
    return typeof v === 'string' ? v : '';
}

export default function ResearchDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const { addToast } = useToast();
    const [record, setRecord] = useState<ResearchRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [status, setStatus] = useState('draft');
    const [offeringsText, setOfferingsText] = useState('');
    const [techStackText, setTechStackText] = useState('');
    const [competitorsText, setCompetitorsText] = useState('');
    const [marketPosition, setMarketPosition] = useState('');
    const [researchData, setResearchData] = useState<Record<string, unknown>>({});
    const [contextBlock, setContextBlock] = useState('');

    useEffect(() => {
        if (!id) return;
        fetch(`/api/recon/research/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setRecord(data);
                setTitle(data.title || '');
                setSummary(data.summary || '');
                setStatus(data.status || 'draft');
                setContextBlock(data.context_block || '');
                const rd = data.research_data && typeof data.research_data === 'object' ? { ...data.research_data } : {};
                setResearchData(rd);
                setOfferingsText(arrayToText(rd.offerings ?? data.offerings));
                setTechStackText(arrayToText(rd.tech_stack ?? data.tech_stack));
                setCompetitorsText(arrayToText(data.competitors));
                setMarketPosition(String(rd.market_position ?? data.market_position ?? ''));
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const buildPatchPayload = () => {
        const payload: Record<string, unknown> = {
            version: record!.version,
            title: title.slice(0, 500),
            summary: summary.slice(0, 5000),
            status,
            context_block: contextBlock || undefined,
        };
        const rt = record!.research_type;
        if (rt === 'company') {
            payload.competitors = textToArray(competitorsText);
            payload.research_data = {
                ...researchData,
                offerings: textToArray(offeringsText),
                tech_stack: textToArray(techStackText),
                market_position: marketPosition || undefined,
            };
            payload.offerings = textToArray(offeringsText);
            payload.tech_stack = textToArray(techStackText);
            payload.market_position = marketPosition || undefined;
        } else if (rt === 'industry' || rt === 'function' || rt === 'technology') {
            payload.research_data = researchData;
        } else {
            payload.offerings = textToArray(offeringsText);
            payload.tech_stack = textToArray(techStackText);
            payload.competitors = textToArray(competitorsText);
            payload.market_position = marketPosition || undefined;
        }
        return payload;
    };

    const handleSave = async () => {
        if (!record) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/recon/research/${record.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildPatchPayload()),
            });
            const data = await res.json();
            if (res.status === 409) {
                setError('Record was modified by another user. Refreshing...');
                const refetch = await fetch(`/api/recon/research/${record.id}`);
                const updated = await refetch.json();
                if (!updated.error) {
                    setRecord(updated);
                    setTitle(updated.title || '');
                    setSummary(updated.summary || '');
                    setStatus(updated.status || 'draft');
                    setContextBlock(updated.context_block || '');
                    const rd = updated.research_data && typeof updated.research_data === 'object' ? { ...updated.research_data } : {};
                    setResearchData(rd);
                    setOfferingsText(arrayToText(rd.offerings ?? updated.offerings));
                    setTechStackText(arrayToText(rd.tech_stack ?? updated.tech_stack));
                    setCompetitorsText(arrayToText(updated.competitors));
                    setMarketPosition(String(rd.market_position ?? updated.market_position ?? ''));
                }
                return;
            }
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            setRecord({ ...record, ...data, version: data.version ?? record.version + 1 });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const performDelete = async () => {
        if (!record) return;
        setDeleting(true);
        setError(null);
        try {
            const res = await fetch(`/api/recon/research/${record.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete');
            }
            addToast({ title: 'Research record deleted', variant: 'success' });
            router.push('/recon/research');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const handleDelete = () => {
        if (!record) return;
        addToast({
            title: 'Delete this research record?',
            description: 'This cannot be undone.',
            variant: 'warning',
            duration: 0,
            actions: [
                { label: 'Cancel', onClick: dismiss => dismiss() },
                { label: 'Delete', variant: 'danger', onClick: dismiss => { dismiss(); performDelete(); } },
            ],
        });
    };

    if (loading) {
        return (
            <InternalAppShell title="RECON" subtitle="Research">
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                </div>
            </InternalAppShell>
        );
    }

    if (error && !record) {
        return (
            <InternalAppShell title="RECON" subtitle="Research">
                <main className="mx-auto max-w-6xl px-6 py-10">
                    <div className="mb-6 flex items-center gap-3">
                        <Link href="/recon/research">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={14} className="mr-1" /> Back
                            </Button>
                        </Link>
                    </div>
                    <Card variant="default" padding="lg">
                        <p className="text-sm text-foreground-secondary">{error}</p>
                        <Button variant="secondary" size="sm" className="mt-4" onClick={() => router.push('/recon/research')}>
                            Back to Research
                        </Button>
                    </Card>
                </main>
            </InternalAppShell>
        );
    }

    if (!record) return null;

    return (
        <InternalAppShell title="RECON" subtitle="Edit Research">
            <main className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/recon/research">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={14} className="mr-1" /> Back
                            </Button>
                        </Link>
                        <h2 className="text-2xl font-semibold text-foreground">Edit Research</h2>
                        <span className="rounded bg-surface-raised px-1.5 py-0.5 text-xs text-foreground-tertiary">
                            v{record.version}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-error hover:bg-error-bg hover:text-error"
                        >
                            <Trash2 size={14} className="mr-1" /> {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                            <Save size={14} className="mr-1" /> {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-md bg-error-bg p-4 text-sm text-error-text">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <Card variant="default" padding="lg">
                        <h3 className="mb-4 border-b border-border pb-2 text-sm font-medium text-foreground">Editable fields</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-medium text-foreground-secondary">Title</label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={500} />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-medium text-foreground-secondary">Summary</label>
                                <textarea
                                    value={summary}
                                    onChange={e => setSummary(e.target.value)}
                                    maxLength={5000}
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-medium text-foreground-secondary">Status</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    {VALID_STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-medium text-foreground-secondary">Context block</label>
                                <textarea
                                    value={contextBlock}
                                    onChange={e => setContextBlock(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="2-3 paragraphs of context from research"
                                />
                            </div>
                            {(record.research_type === 'company' || !record.research_type) && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Competitors (one per line)</label>
                                        <textarea
                                            value={competitorsText}
                                            onChange={e => setCompetitorsText(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="One item per line"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Offerings (one per line)</label>
                                        <textarea
                                            value={offeringsText}
                                            onChange={e => setOfferingsText(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="One item per line"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Tech stack (one per line)</label>
                                        <textarea
                                            value={techStackText}
                                            onChange={e => setTechStackText(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="One item per line"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Market position</label>
                                        <Input value={marketPosition} onChange={e => setMarketPosition(e.target.value)} />
                                    </div>
                                </>
                            )}
                            {record.research_type === 'industry' && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Key players (one per line)</label>
                                        <textarea
                                            value={getResearchDataArray(researchData, 'key_players').join('\n')}
                                            onChange={e => setResearchData({ ...researchData, key_players: textToArray(e.target.value) })}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="One per line"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Market trends</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'market_trends')}
                                            onChange={e => setResearchData({ ...researchData, market_trends: e.target.value })}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Buying triggers</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'buying_triggers')}
                                            onChange={e => setResearchData({ ...researchData, buying_triggers: e.target.value })}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Compliance notes</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'compliance_notes')}
                                            onChange={e => setResearchData({ ...researchData, compliance_notes: e.target.value })}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </>
                            )}
                            {record.research_type === 'function' && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Related roles (one per line)</label>
                                        <textarea
                                            value={getResearchDataArray(researchData, 'related_roles').join('\n')}
                                            onChange={e => setResearchData({ ...researchData, related_roles: textToArray(e.target.value) })}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="One per line"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Best practices</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'best_practices')}
                                            onChange={e => setResearchData({ ...researchData, best_practices: e.target.value })}
                                            rows={4}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">SOP patterns</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'sop_patterns')}
                                            onChange={e => setResearchData({ ...researchData, sop_patterns: e.target.value })}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Escalation norms</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'escalation_norms')}
                                            onChange={e => setResearchData({ ...researchData, escalation_norms: e.target.value })}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </>
                            )}
                            {record.research_type === 'technology' && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Alternatives (one per line)</label>
                                        <textarea
                                            value={getResearchDataArray(researchData, 'alternatives').join('\n')}
                                            onChange={e => setResearchData({ ...researchData, alternatives: textToArray(e.target.value) })}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="One per line"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Capabilities</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'capabilities')}
                                            onChange={e => setResearchData({ ...researchData, capabilities: e.target.value })}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Integration patterns</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'integration_patterns')}
                                            onChange={e => setResearchData({ ...researchData, integration_patterns: e.target.value })}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-foreground-secondary">Adoption notes</label>
                                        <textarea
                                            value={getResearchDataString(researchData, 'adoption_notes')}
                                            onChange={e => setResearchData({ ...researchData, adoption_notes: e.target.value })}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    <Card variant="default" padding="lg">
                        <h3 className="mb-4 border-b border-border pb-2 text-sm font-medium text-foreground">Read-only</h3>
                        <dl className="space-y-2 text-sm">
                            {record.research_type && (
                                <div>
                                    <dt className="text-foreground-tertiary">Research type</dt>
                                    <dd className="text-foreground capitalize">{record.research_type}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-foreground-tertiary">Source</dt>
                                <dd className="text-foreground">{record.source}</dd>
                            </div>
                            {record.confidence_score != null && (
                                <div>
                                    <dt className="text-foreground-tertiary">Confidence</dt>
                                    <dd className="text-foreground">{Math.round(record.confidence_score * 100)}%</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-foreground-tertiary">Updated</dt>
                                <dd className="text-foreground">{new Date(record.updated_at).toLocaleString()}</dd>
                            </div>
                        </dl>
                    </Card>
                </div>
            </main>
        </InternalAppShell>
    );
}
