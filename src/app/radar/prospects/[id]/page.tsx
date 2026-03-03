'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, Mail, Clock } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Prospect {
    id: string; email: string | null; first_name: string | null; last_name: string | null;
    company_name: string | null; title: string | null; industry: string | null;
    phone: string | null; linkedin_url: string | null; instagram_handle: string | null;
    website_url: string | null; location: string | null; score: number;
    status: string; tags: string[]; enriched_at: string | null;
    enrichment_data: Record<string, unknown> | null; version: number;
    created_at: string; updated_at: string;
}

export default function ProspectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [prospect, setProspect] = useState<Prospect | null>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enriching, setEnriching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<Partial<Prospect>>({});

    useEffect(() => {
        fetch(`/api/radar/prospects/${id}`)
            .then((r) => r.json())
            .then((d) => {
                setProspect(d.prospect);
                setForm(d.prospect || {});
                setEnrollments(d.enrollments || []);
                setEvents(d.events || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleSave = async () => {
        if (!prospect) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/radar/prospects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, version: prospect.version }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');
            setProspect(data.prospect);
            setForm(data.prospect);
            setEditMode(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleEnrich = async () => {
        setEnriching(true);
        try {
            const res = await fetch(`/api/radar/prospects/${id}/enrich`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Enrichment failed');
            setProspect(data.prospect);
            setForm(data.prospect);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Enrichment failed');
        } finally {
            setEnriching(false);
        }
    };

    const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    if (loading) {
        return (
            <InternalAppShell title="RADAR — Prospect">
                <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-foreground-secondary" /></div>
            </InternalAppShell>
        );
    }

    if (!prospect) {
        return (
            <InternalAppShell title="RADAR — Prospect">
                <main className="mx-auto max-w-2xl px-6 py-10">
                    <p className="text-sm text-foreground-secondary">Prospect not found.</p>
                    <Link href="/radar/prospects"><Button variant="ghost" size="sm" className="mt-4">Back</Button></Link>
                </main>
            </InternalAppShell>
        );
    }

    const displayName = [prospect.first_name, prospect.last_name].filter(Boolean).join(' ') || prospect.email || 'Unknown';

    return (
        <InternalAppShell title={`RADAR — ${displayName}`} subtitle="Prospect detail">
            <main className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/radar/prospects" className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground">
                        <ArrowLeft size={14} /> Back to Prospects
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleEnrich} disabled={enriching}>
                            <Sparkles size={14} className="mr-1" />
                            {enriching ? 'Enriching…' : 'Enrich with AI'}
                        </Button>
                        {editMode ? (
                            <>
                                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setEditMode(false); setForm(prospect); }}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>Edit</Button>
                        )}
                    </div>
                </div>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card variant="default" padding="lg">
                            <h3 className="mb-4 text-base font-medium text-foreground">Contact Info</h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { label: 'First Name', field: 'first_name' },
                                    { label: 'Last Name', field: 'last_name' },
                                    { label: 'Email', field: 'email' },
                                    { label: 'Phone', field: 'phone' },
                                    { label: 'Company', field: 'company_name' },
                                    { label: 'Title', field: 'title' },
                                    { label: 'Industry', field: 'industry' },
                                    { label: 'Location', field: 'location' },
                                    { label: 'Website', field: 'website_url' },
                                    { label: 'LinkedIn', field: 'linkedin_url' },
                                ].map(({ label, field }) => (
                                    <div key={field}>
                                        <label className="mb-1 block text-xs font-medium text-foreground-secondary">{label}</label>
                                        {editMode ? (
                                            <Input value={(form as any)[field] || ''} onChange={setField(field)} />
                                        ) : (
                                            <p className="text-sm text-foreground">{(prospect as any)[field] || '—'}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Enrichment data */}
                        {prospect.enrichment_data && (
                            <Card variant="default" padding="lg">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-base font-medium text-foreground">AI Enrichment</h3>
                                    {prospect.enriched_at && (
                                        <span className="text-xs text-foreground-secondary">
                                            {new Date(prospect.enriched_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <pre className="overflow-x-auto rounded bg-canvas-secondary p-3 text-xs text-foreground-secondary">
                                    {JSON.stringify(prospect.enrichment_data, null, 2)}
                                </pre>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Score */}
                        <Card variant="default" padding="md">
                            <p className="text-xs font-medium text-foreground-secondary">Prospect Score</p>
                            <p className="mt-1 text-3xl font-semibold text-foreground">{prospect.score}</p>
                            <Badge variant={prospect.status === 'active' ? 'live' : 'draft'} size="sm" className="mt-2">
                                {prospect.status}
                            </Badge>
                        </Card>

                        {/* Recent events */}
                        <Card variant="default" padding="md">
                            <h3 className="mb-3 text-sm font-medium text-foreground">Outreach Timeline</h3>
                            {events.length === 0 ? (
                                <p className="text-xs text-foreground-secondary">No outreach yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {events.map((e) => (
                                        <div key={e.id} className="flex items-start gap-2">
                                            <Mail size={12} className="mt-0.5 flex-shrink-0 text-foreground-secondary" />
                                            <div>
                                                <p className="text-xs font-medium text-foreground capitalize">{e.event_type}</p>
                                                <p className="text-xs text-foreground-secondary">Step {e.step_number} — {new Date(e.occurred_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Enrollments */}
                        <Card variant="default" padding="md">
                            <h3 className="mb-3 text-sm font-medium text-foreground">Campaign Enrollments</h3>
                            {enrollments.length === 0 ? (
                                <p className="text-xs text-foreground-secondary">Not enrolled in any campaigns.</p>
                            ) : (
                                <div className="space-y-2">
                                    {enrollments.map((e) => (
                                        <div key={e.id}>
                                            <p className="text-xs font-medium text-foreground">{(e.campaigns as any)?.name || '—'}</p>
                                            <p className="text-xs text-foreground-secondary capitalize">
                                                {e.status} · Step {e.current_step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </InternalAppShell>
    );
}
