'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Database, Upload, FileText, X, Trash2, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface KnowledgeBase {
    id: string;
    name: string;
    description: string | null;
    type: string;
    status: string;
    version: number;
    documents?: { id: string; filename: string; chunk_count: number }[];
}

interface KbScorecard {
    document_count: number;
    total_chunks: number;
    max_documents: number;
    max_chunks: number;
    coverage_documents_pct: number;
    coverage_chunks_pct: number;
    recommendation: string;
    recommendation_reason: string;
    checks: { id: string; label: string; passed: boolean; detail?: string }[];
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPT_FORMATS = '.txt,.md,.csv,.pdf';

export default function KBDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { addToast } = useToast();
    const [kb, setKb] = useState<KnowledgeBase | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scorecard, setScorecard] = useState<KbScorecard | null>(null);

    // Editable fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/knowledge-base/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setKb(data);
                setName(data.name || '');
                setDescription(data.description || '');
                setStatus(data.status || 'draft');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [params.id]);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/knowledge-base/${params.id}/scorecard`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setScorecard(data);
            })
            .catch(() => setScorecard(null));
    }, [params.id, kb?.documents?.length, kb?.status]);

    const handleSave = async () => {
        if (!kb) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/knowledge-base/${kb.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    status,
                    version: kb.version
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            setKb(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !kb) return;
        if (file.size > MAX_FILE_SIZE) {
            setError('File must be under 2 MB');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`/api/knowledge-base/${kb.id}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setKb(prev => prev ? {
                ...prev,
                documents: [...(prev.documents || []), data]
            } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeDocument = async (docId: string) => {
        if (!kb) return;
        try {
            const res = await fetch(`/api/knowledge-base/${kb.id}/documents/${docId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove');
            setKb(prev => prev ? {
                ...prev,
                documents: (prev.documents || []).filter(d => d.id !== docId)
            } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove');
        }
    };

    const performDelete = async () => {
        if (!kb) return;
        setDeleting(true);
        setError(null);
        try {
            const res = await fetch(`/api/knowledge-base/${kb.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete');
            }
            addToast({ title: 'Knowledge base deleted', variant: 'success' });
            router.push('/recon/kb');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const handleDelete = () => {
        if (!kb) return;
        addToast({
            title: 'Delete this knowledge base?',
            description: 'All documents and chunks will be removed. Demos using this KB will have it unlinked.',
            variant: 'warning',
            duration: 0,
            actions: [
                { label: 'Cancel', onClick: dismiss => dismiss() },
                { label: 'Delete', variant: 'danger', onClick: dismiss => { dismiss(); performDelete(); } },
            ],
        });
    };

    if (loading) return (
        <InternalAppShell title="RECON" subtitle="Knowledge Base">
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-foreground-secondary" /></div>
        </InternalAppShell>
    );

    if (!kb) return (
        <InternalAppShell title="RECON" subtitle="Knowledge Base">
            <div className="py-20 text-center text-foreground-secondary">KB not found.</div>
        </InternalAppShell>
    );

    return (
        <InternalAppShell title="RECON" subtitle="Edit Knowledge Base">
            <main className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/recon/kb">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={14} className="mr-1" /> Back
                            </Button>
                        </Link>
                        <h2 className="text-2xl font-semibold text-foreground">Edit Knowledge Base</h2>
                        <span className="rounded bg-surface-raised px-1.5 py-0.5 text-xs text-foreground-tertiary">
                            {kb.type}
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
                            <Save size={14} className="mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-md bg-error-bg p-4 text-sm text-error-text">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <Card variant="default" padding="lg">
                            <h3 className="mb-4 text-sm font-medium text-foreground border-b border-border pb-2">Metadata</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-foreground-secondary">Name</label>
                                    <Input value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-foreground-secondary">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="h-24 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-foreground-secondary">Lifecycle Status</label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                        className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="draft">Draft (In Progress)</option>
                                        <option value="reviewed">Reviewed (Pending Approval)</option>
                                        <option value="approved">Approved (Live)</option>
                                        <option value="archived">Archived (Deprecated)</option>
                                    </select>
                                    <p className="mt-1 text-xs text-foreground-tertiary">
                                        Only 'Approved' KBs can be selected by agents and other users.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {scorecard && (
                            <Card variant="default" padding="lg">
                                <h3 className="mb-4 text-sm font-medium text-foreground border-b border-border pb-2 flex items-center gap-2">
                                    <ClipboardList size={16} /> Quality Scorecard
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-xs text-foreground-secondary">
                                        {scorecard.document_count} / {scorecard.max_documents} documents, {scorecard.total_chunks} / {scorecard.max_chunks} chunks
                                    </p>
                                    <p className="text-xs font-medium text-foreground">
                                        Recommendation: {scorecard.recommendation}
                                    </p>
                                    <p className="text-xs text-foreground-tertiary">{scorecard.recommendation_reason}</p>
                                    <ul className="space-y-1.5">
                                        {scorecard.checks.map(c => (
                                            <li key={c.id} className="flex items-center gap-2 text-xs">
                                                {c.passed ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-amber-600" />}
                                                <span className={c.passed ? 'text-foreground-secondary' : 'text-foreground'}>{c.label}</span>
                                                {c.detail && <span className="text-foreground-tertiary">— {c.detail}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card variant="default" padding="lg">
                            <h3 className="mb-4 text-sm font-medium text-foreground border-b border-border pb-2">Documents</h3>

                            <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-6 text-sm text-foreground-secondary transition-colors hover:border-primary hover:text-primary">
                                <Upload size={16} />
                                {uploading ? 'Uploading...' : 'Upload File (txt, md, csv, pdf)'}
                                <input type="file" className="hidden" accept={ACCEPT_FORMATS} onChange={handleUpload} disabled={uploading} />
                            </label>

                            <div className="space-y-2">
                                {kb.documents?.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between rounded-md border border-border bg-surface p-3 transition-colors hover:border-border-strong">
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className="text-foreground-muted" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{doc.filename}</p>
                                                <p className="text-xs text-foreground-tertiary">{doc.chunk_count} chunks</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeDocument(doc.id)} className="text-foreground-muted hover:text-error-text">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(!kb.documents || kb.documents.length === 0) && (
                                    <p className="text-center text-sm text-foreground-tertiary">No documents uploaded yet.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </InternalAppShell>
    );
}
