'use client';

import { useState, useRef, useEffect } from 'react';
import { Database, Upload, FileText, X } from 'lucide-react';

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
    const [creating, setCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (knowledgeBaseId && documents.length === 0) {
            fetch(`/api/knowledge-base/${knowledgeBaseId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.documents) {
                        onUpdate({ documents: data.documents });
                    }
                })
                .catch(() => {});
        }
    }, [knowledgeBaseId]);

    const createKnowledgeBase = async () => {
        if (!draftId) return;
        setCreating(true);
        setError(null);
        try {
            const res = await fetch('/api/knowledge-base', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ demoId: draftId, name: 'Default', type: 'custom' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create knowledge base');
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
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Knowledge base
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Upload documents (FAQs, product catalogs, etc.) to give your agent additional context. Optional.
            </p>

            {!knowledgeBaseId ? (
                <div style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: '8px',
                    padding: '32px',
                    textAlign: 'center',
                    marginBottom: '24px',
                }}>
                    <Database size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                        Add a knowledge base to enhance your agent with document-based answers
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={createKnowledgeBase}
                            disabled={!draftId || creating}
                            style={{
                                ...btnBase,
                                background: 'var(--color-primary)',
                                color: '#FFFFFF',
                                opacity: draftId && !creating ? 1 : 0.6,
                            }}
                        >
                            {creating ? 'Creating...' : 'Create knowledge base'}
                        </button>
                        <button
                            onClick={skipAndNext}
                            style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)' }}
                        >
                            Skip
                        </button>
                    </div>
                </div>
            ) : (
                <>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button
                            onClick={onBack}
                            style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
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
                </>
            )}
        </div>
    );
}
