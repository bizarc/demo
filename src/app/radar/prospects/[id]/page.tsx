'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, Sparkles, Mail, AlertCircle,
    ExternalLink, Phone, Globe, MapPin, FlaskConical, Trash2,
} from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

interface Prospect {
    id: string; email: string | null; first_name: string | null; last_name: string | null;
    company_name: string | null; title: string | null; industry: string | null;
    phone: string | null; linkedin_url: string | null; instagram_handle: string | null;
    website_url: string | null; location: string | null; city: string | null; state: string | null;
    address: string | null; google_rating: number | null; google_review_count: number | null;
    score: number; status: string; tags: string[]; enriched_at: string | null;
    enrichment_data: Record<string, unknown> | null; version: number;
    created_at: string; updated_at: string;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
}

export default function ProspectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { addToast } = useToast();
    const [prospect, setProspect] = useState<Prospect | null>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [enriching, setEnriching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<Partial<Prospect>>({});
    const [showEnrollDropdown, setShowEnrollDropdown] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const [prospectRes, campaignRes] = await Promise.all([
                    fetch(`/api/radar/prospects/${id}`),
                    fetch('/api/radar/campaigns?status=active&limit=50'),
                ]);
                const prospectData = await prospectRes.json();
                const campaignData = await campaignRes.json();
                if (cancelled) return;
                if (!prospectRes.ok) {
                    setError(prospectData.error || 'Prospect not found');
                    setProspect(null);
                    setEnrollments([]);
                    setEvents([]);
                    setCampaigns(campaignData.campaigns || []);
                    return;
                }
                setProspect(prospectData.prospect);
                setForm(prospectData.prospect || {});
                setEnrollments(prospectData.enrollments || []);
                setEvents(prospectData.events || []);
                setCampaigns(campaignData.campaigns || []);
                setError(null);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load prospect');
                    setProspect(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
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
        setError(null);
        try {
            const res = await fetch(`/api/radar/prospects/${id}/enrich`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Enrichment failed');
            setProspect(data.prospect);
            setForm(data.prospect);
            if (data.email_found) {
                addToast({ title: 'Enrichment complete', description: 'Email and company details updated.', variant: 'success' });
            } else {
                addToast({
                    title: 'Enrichment complete',
                    description: 'No email could be found for this prospect. Company details may still have been updated.',
                    variant: 'warning',
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Enrichment failed');
            addToast({ title: 'Enrichment failed', description: err instanceof Error ? err.message : 'Enrichment failed', variant: 'error' });
        } finally {
            setEnriching(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        setError(null);
        try {
            const res = await fetch(`/api/radar/prospects/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            setShowDeleteModal(false);
            addToast({ title: 'Prospect deleted', variant: 'success' });
            router.push('/radar/prospects');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
            addToast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Delete failed', variant: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const handleEnrollInCampaign = async (campaignId: string) => {
        setEnrolling(true);
        setShowEnrollDropdown(false);
        setError(null);
        try {
            const res = await fetch(`/api/radar/campaigns/${campaignId}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospect_ids: [id] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Enrollment failed');
            // Reload enrollments
            const updated = await fetch(`/api/radar/prospects/${id}`).then((r) => r.json());
            setEnrollments(updated.enrollments || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Enrollment failed');
        } finally {
            setEnrolling(false);
        }
    };

    const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    if (loading) {
        return (
            <InternalAppShell title="RADAR — Prospect">
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                </div>
            </InternalAppShell>
        );
    }

    if (!prospect) {
        return (
            <InternalAppShell title="RADAR — Prospect">
                <main className="mx-auto max-w-2xl px-6 py-10">
                    <p className="text-sm text-foreground-secondary">{error || 'Prospect not found.'}</p>
                    <Link href="/radar/prospects">
                        <Button variant="ghost" size="sm" className="mt-4">Back</Button>
                    </Link>
                </main>
            </InternalAppShell>
        );
    }

    const displayName = [prospect.first_name, prospect.last_name].filter(Boolean).join(' ')
        || prospect.company_name
        || 'Unknown';

    const labUrl = `/lab?${new URLSearchParams({
        company: prospect.company_name || '',
        website: prospect.website_url || '',
        industry: prospect.industry || '',
        prospect_id: prospect.id,
    }).toString()}`;

    return (
        <InternalAppShell title={`RADAR — ${displayName}`} subtitle="Prospect detail">
            <main className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/radar/prospects" className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground">
                        <ArrowLeft size={14} /> Back to Prospects
                    </Link>
                    <div className="flex gap-2">
                        {/* LAB handoff */}
                        <Link href={labUrl}>
                            <Button variant="ghost" size="sm">
                                <FlaskConical size={14} className="mr-1" />
                                Create Demo in LAB
                                <ExternalLink size={12} className="ml-1" />
                            </Button>
                        </Link>

                        {/* Enroll in Campaign */}
                        <div className="relative">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowEnrollDropdown(!showEnrollDropdown)}
                                disabled={enrolling}
                            >
                                {enrolling ? <Loader2 size={14} className="animate-spin mr-1" /> : <Mail size={14} className="mr-1" />}
                                Enroll in Campaign
                            </Button>
                            {showEnrollDropdown && campaigns.length > 0 && (
                                <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-border bg-canvas shadow-lg">
                                    {campaigns.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleEnrollInCampaign(c.id)}
                                            className="block w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-canvas-secondary"
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showEnrollDropdown && campaigns.length === 0 && (
                                <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-border bg-canvas p-3 shadow-lg">
                                    <p className="text-xs text-foreground-secondary">
                                        No active campaigns.{' '}
                                        <Link href="/radar/campaigns/new" className="text-primary hover:underline">
                                            Create one
                                        </Link>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* AI Enrich */}
                        <Button variant="secondary" size="sm" onClick={handleEnrich} disabled={enriching}>
                            <Sparkles size={14} className="mr-1" />
                            {enriching ? 'Enriching…' : 'Enrich with AI'}
                        </Button>

                        {/* Edit */}
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

                        {/* Delete */}
                        <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
                            <Trash2 size={14} className="mr-1" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Delete confirmation modal */}
                <Modal
                    open={showDeleteModal}
                    onClose={() => !deleting && setShowDeleteModal(false)}
                    title="Delete prospect"
                    description={`Remove ${displayName} from your pipeline? This cannot be undone.`}
                    size="sm"
                    footer={
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                                Cancel
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
                                {deleting ? 'Deleting…' : 'Delete'}
                            </Button>
                        </>
                    }
                >
                    <p className="text-sm text-foreground-secondary">Enrollments and outreach history for this prospect will remain in the system for reporting.</p>
                </Modal>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                {/* Email missing warning */}
                {!prospect.email && (
                    <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-amber-600" />
                            <span className="text-sm text-amber-800">
                                No email address found. Run AI enrichment to search for one automatically, or add it manually.
                            </span>
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleEnrich} disabled={enriching}>
                            <Sparkles size={13} className="mr-1" />
                            {enriching ? 'Searching…' : 'Find Email'}
                        </Button>
                    </div>
                )}

                {!prospect.email && (
                    <div className="mb-4 text-xs text-foreground-tertiary">
                        You can enroll this prospect now; emails will send once an email address is added (e.g. via Edit or Find Email).
                    </div>
                )}

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
                                    { label: 'City', field: 'city' },
                                    { label: 'State', field: 'state' },
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

                            {/* Google Places data */}
                            {(prospect.google_rating || prospect.address) && (
                                <div className="mt-4 border-t border-border pt-4">
                                    <p className="mb-2 text-xs font-medium text-foreground-secondary">From Google Places</p>
                                    <div className="flex flex-wrap gap-3 text-xs text-foreground-secondary">
                                        {prospect.google_rating && (
                                            <span>★ {prospect.google_rating} ({prospect.google_review_count} reviews)</span>
                                        )}
                                        {prospect.address && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin size={10} /> {prospect.address}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
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
                        {/* Status */}
                        <Card variant="default" padding="md">
                            <p className="text-xs font-medium text-foreground-secondary">Status</p>
                            <Badge
                                variant={
                                    prospect.status === 'active' ? 'live' :
                                    prospect.status === 'new' ? 'draft' :
                                    prospect.status === 'unsubscribed' ? 'type' : 'archived'
                                }
                                size="sm"
                                className="mt-2"
                            >
                                {prospect.status}
                            </Badge>
                            {prospect.score > 0 && (
                                <p className="mt-2 text-sm font-medium text-foreground">Score: {prospect.score}</p>
                            )}
                            {prospect.tags?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {prospect.tags.map((tag) => (
                                        <span key={tag} className="rounded bg-canvas-secondary px-1.5 py-0.5 text-xs text-foreground-secondary">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Contact links */}
                        <Card variant="default" padding="md">
                            <p className="mb-2 text-xs font-medium text-foreground-secondary">Quick Links</p>
                            <div className="space-y-1.5">
                                {prospect.website_url && (
                                    <a href={prospect.website_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                                        <Globe size={12} /> {new URL(prospect.website_url).hostname.replace('www.', '')}
                                    </a>
                                )}
                                {prospect.phone && (
                                    <a href={`tel:${prospect.phone}`} className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground">
                                        <Phone size={12} /> {prospect.phone}
                                    </a>
                                )}
                                {prospect.email && (
                                    <a href={`mailto:${prospect.email}`} className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground">
                                        <Mail size={12} /> {prospect.email}
                                    </a>
                                )}
                            </div>
                        </Card>

                        {/* Outreach timeline */}
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
                                                <p className="text-xs text-foreground-secondary">
                                                    Step {e.step_number} — {new Date(e.occurred_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Campaign enrollments */}
                        <Card variant="default" padding="md">
                            <h3 className="mb-3 text-sm font-medium text-foreground">Campaign Enrollments</h3>
                            {enrollments.length === 0 ? (
                                <p className="text-xs text-foreground-secondary">Not enrolled in any campaigns.</p>
                            ) : (
                                <div className="space-y-2">
                                    {enrollments.map((e) => (
                                        <div key={e.id}>
                                            <Link
                                                href={`/radar/campaigns/${e.campaign_id}`}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                {(e.campaigns as any)?.name || '—'}
                                            </Link>
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
