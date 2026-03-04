'use client';

import { useEffect, useState } from 'react';

export interface KnowledgeBaseOption {
    id: string;
    name: string;
    type?: string;
    description?: string | null;
    status?: string;
}

export interface KnowledgeBaseSelectProps {
    value: string;
    onChange: (value: string) => void;
    statusFilter?: 'draft' | 'reviewed' | 'approved' | 'archived';
    label?: string;
    disabled?: boolean;
    className?: string;
    selectClassName?: string;
}

export function KnowledgeBaseSelect({
    value,
    onChange,
    statusFilter,
    label = 'Knowledge Base',
    disabled = false,
    className = '',
    selectClassName = '',
}: KnowledgeBaseSelectProps) {
    const [options, setOptions] = useState<KnowledgeBaseOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchKbs() {
            try {
                const url = statusFilter
                    ? `/api/knowledge-base?status=${statusFilter}`
                    : '/api/knowledge-base';
                const res = await fetch(url);
                const data = await res.json();
                if (!cancelled && Array.isArray(data.knowledgeBases)) {
                    setOptions(data.knowledgeBases);
                }
            } catch (err) {
                console.error('KnowledgeBaseSelect fetch error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchKbs();
        return () => { cancelled = true; };
    }, [statusFilter]);

    const selectClass = `w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${selectClassName}`;

    return (
        <div className={className}>
            {label && (
                <label className="mb-2 block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || loading}
                className={selectClass}
            >
                <option value="">None</option>
                {options.map((kb) => (
                    <option key={kb.id} value={kb.id}>
                        {kb.name}
                    </option>
                ))}
            </select>
            {loading && (
                <p className="mt-1 text-xs text-foreground-tertiary">Loading knowledge bases…</p>
            )}
        </div>
    );
}
