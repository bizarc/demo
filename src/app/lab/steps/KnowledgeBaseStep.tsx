'use client';

import { useState, useRef, useEffect } from 'react';
import { Database, Upload, FileText, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface KB {
    id: string;
    name: string;
    description: string | null;
}

interface KnowledgeBaseStepProps {
    draftId: string | null;
    knowledgeBaseId: string | null;
    documents: { id: string; filename: string; chunk_count: number }[];
    onUpdate: (updates: {
        knowledgeBaseId?: string | null;
        documents?: { id: string; filename: string; chunk_count: number }[];
    }) => void;
    onNext: () => void;
    onBack: () => void;
}

const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms',
};

const ACCEPT_FORMATS = '.txt,.md,.csv,.pdf';
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function KnowledgeBaseStep({
    draftId,
    knowledgeBaseId,
    documents,
    onUpdate,
    onNext,
    onBack,
}: KnowledgeBaseStepProps) {
    const [availableKbs, setAvailableKbs] = useState<KB[]>([]);
    const [loadingKbs, setLoadingKbs] = useState(true);
    const [creating, setCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreatingInline, setIsCreatingInline] = useState(false);
    const [newKbName, setNewKbName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch available approved KBs from RECON
    useEffect(() => {
        async function fetchKbs() {
            try {
                const res = await fetch('/api/knowledge-base?status=approved');
                const data = await res.json();
                setAvailableKbs(data.knowledgeBases || []);
            } catch (err) {
                console.error('Failed to fetch KBs:', err);
            } finally {
                setLoadingKbs(false);
            }
        }
        fetchKbs();
    }, []);

    // Fetch documents if an existing KB is selected but docs aren't loaded
    useEffect(() => {
        if (knowledgeBaseId && documents.length === 0) {
            fetch(`/api/knowledge-base/${knowledgeBaseId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.documents) {
                        onUpdate({ documents: data.documents });
                    }
                })
                .catch(() => { });
        }
    }, [knowledgeBaseId]);

    const handleSelectExisting = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) {
            onUpdate({ knowledgeBaseId: null, documents: [] });
            return;
        }
        if (val === 'CREATE_NEW') {
            setIsCreatingInline(true);
            return;
        }
        setIsCreatingInline(false);
        onUpdate({ knowledgeBaseId: val, documents: [] });
    };

    const createInlineKnowledgeBase = async () => {
        if (!newKbName.trim()) {
            setError('Please provide a name for the new knowledge base.');
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const res = await fetch('/api/knowledge-base', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKbName.trim(), type: 'custom' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create knowledge base');

            setAvailableKbs(prev => [data, ...prev]);
            setIsCreatingInline(false);
            setNewKbName('');
            onUpdate({ knowledgeBaseId: data.id, documents: [] });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create');
        } finally {
            setCreating(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !knowledgeBaseId) return;
        if (file.size > MAX_FILE_SIZE) {
            setError('File must be under 2 MB');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`/api/knowledge-base/${knowledgeBaseId}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            onUpdate({
                documents: [
                    ...documents,
                    { id: data.id, filename: data.filename, chunk_count: data.chunk_count },
                ],
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeDocument = async (docId: string) => {
        if (!knowledgeBaseId) return;
        try {
            const res = await fetch(`/api/knowledge-base/${knowledgeBaseId}/documents/${docId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove');
            onUpdate({ documents: documents.filter((d) => d.id !== docId) });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove');
        }
    };

    const skipAndNext = () => {
        onUpdate({ knowledgeBaseId: null, documents: [] });
        onNext();
    };

    return (
        <div>
            <h2 className="mb-2 text-2xl font-semibold text-foreground">
                Knowledge Base (RECON)
            </h2>
            <p className="mb-6 text-sm text-foreground-secondary">
                Connect a RECON Knowledge Base to give your agent additional context. You can select an existing approved KB or create a new global asset inline.
            </p>

            <div className="mb-6 rounded-lg border border-border p-6 shadow-sm">
                <label className="mb-2 block text-sm font-medium text-foreground">
                    Connect Knowledge Base
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {!isCreatingInline ? (
                        <div className="flex-1">
                            <select
                                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                value={knowledgeBaseId || ''}
                                onChange={handleSelectExisting}
                                disabled={loadingKbs}
                            >
                                <option value="">None (Skip)</option>
                                {availableKbs.map((kb) => (
                                    <option key={kb.id} value={kb.id}>
                                        {kb.name}
                                    </option>
                                ))}
                                <option disabled>──────────</option>
                                <option value="CREATE_NEW">+ Create new KB...</option>
                            </select>
                            {loadingKbs && <p className="mt-1 text-xs text-foreground-tertiary">Loading KBs...</p>}
                        </div>
                    ) : (
                        <div className="flex-1 space-y-3">
                            <div>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Sales Playbook"
                                    className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={newKbName}
                                    onChange={(e) => setNewKbName(e.target.value)}
                                    autoFocus
                                />
                                <p className="mt-1 text-xs text-foreground-tertiary">
                                    This KB will be created in RECON as a 'draft' global asset.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={createInlineKnowledgeBase}
                                    disabled={creating || !newKbName.trim()}
                                >
                                    {creating ? 'Creating...' : 'Create KB'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setIsCreatingInline(false);
                                        setNewKbName('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {knowledgeBaseId && !isCreatingInline && (
                <>
                    <h3 className="mb-3 text-sm font-medium text-foreground">Manage Documents</h3>
                    <div style={{
                        border: '2px dashed var(--color-border)',
                        borderRadius: '8px',
                        padding: '24px',
                        marginBottom: '16px',
                        background: 'var(--color-surface)',
                    }}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPT_FORMATS}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                ...btnBase,
                                width: '100%',
                                justifyContent: 'center',
                                padding: '16px',
                                border: '1px dashed var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            <Upload size={18} />
                            {uploading ? 'Uploading...' : 'Upload file (txt, md, csv, pdf — max 2 MB)'}
                        </button>
                    </div>

                    {documents.length > 0 && (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', marginBottom: '24px' }}>
                            {documents.map((doc) => (
                                <li
                                    key={doc.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 12px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    <FileText size={18} style={{ color: 'var(--color-text-muted)' }} />
                                    <span style={{ flex: 1, fontSize: '14px' }}>{doc.filename}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                        {doc.chunk_count} chunks
                                    </span>
                                    <button
                                        onClick={() => removeDocument(doc.id)}
                                        style={{
                                            ...btnBase,
                                            padding: '4px',
                                            background: 'transparent',
                                            color: 'var(--color-text-muted)',
                                        }}
                                        aria-label="Remove"
                                    >
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {error && (
                <div style={{
                    padding: '12px',
                    background: 'var(--color-error-bg)',
                    borderRadius: '6px',
                    color: 'var(--color-error-text)',
                    fontSize: '14px',
                    marginBottom: '16px',
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                <button
                    onClick={onBack}
                    style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <div className="flex gap-3">
                    {!knowledgeBaseId && !isCreatingInline && (
                        <button
                            onClick={skipAndNext}
                            style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                        >
                            Skip Content
                        </button>
                    )}
                    <button
                        onClick={onNext}
                        style={{ ...btnBase, background: 'var(--color-primary)', color: '#FFFFFF' }}
                    >
                        Continue
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

