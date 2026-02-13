'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCreatorId } from '@/lib/creatorId';
import { useToast } from '@/components/ui/Toast';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { SkeletonDemoRow } from '@/components/ui/Skeleton';

interface DemoListItem {
    id: string;
    company_name: string | null;
    industry: string | null;
    website_url: string | null;
    mission_profile: string | null;
    status: 'draft' | 'active' | 'expired' | 'blueprint';
    current_step: string | null;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
    logo_url: string | null;
    primary_color: string | null;
    openrouter_model: string | null;
}

const MISSION_LABELS: Record<string, string> = {
    reactivation: 'Database Reactivation',
    nurture: 'Inbound Nurture',
    service: 'Customer Service',
    review: 'Review Generation',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'var(--color-border-subtle)', text: 'var(--color-text-secondary)', label: 'Draft' },
    active: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', label: 'Active' },
    expired: { bg: 'var(--color-error-bg)', text: 'var(--color-error-text)', label: 'Expired' },
    blueprint: { bg: 'var(--color-primary-subtle)', text: 'var(--color-primary-subtle-text)', label: 'Blueprint' },
};

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function LabHomePage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [demos, setDemos] = useState<DemoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadDemos = useCallback(async () => {
        const creatorId = getCreatorId();
        if (!creatorId) return;

        try {
            const params = new URLSearchParams({ created_by: creatorId });
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetchWithRetry(`/api/demo?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to load demos');
            setDemos(data.demos || []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load demos';
            setError(msg);
            addToast({ title: 'Failed to load demos', description: msg, variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadDemos();
    }, [loadDemos]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this demo? It can be recovered later.')) return;
        setDeletingId(id);
        try {
            const res = await fetchWithRetry(`/api/demo/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setDemos(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to delete';
            addToast({ title: 'Delete failed', description: msg, variant: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const getMagicLink = (id: string) => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/demo/${id}`;
    };

    const handleCopyLink = async (id: string) => {
        try {
            await navigator.clipboard.writeText(getMagicLink(id));
        } catch {
            // Fallback: select text
        }
    };

    const statusCounts = demos.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-canvas)',
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '24px 32px',
            }}>
                <div className="lab-header-inner" style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                            THE LAB
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            Create and manage AI demo agents
                        </p>
                    </div>
                    <Link
                        href="/lab/new"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: 'var(--color-primary)',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            fontWeight: 500,
                            fontSize: '14px',
                            textDecoration: 'none',
                            transition: 'opacity 150ms',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New demo
                    </Link>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
                {/* Status Filter Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                }}>
                    <FilterTab
                        label="All"
                        count={demos.length}
                        active={statusFilter === null}
                        onClick={() => setStatusFilter(null)}
                    />
                    {(['draft', 'active', 'expired', 'blueprint'] as const).map(status => (
                        <FilterTab
                            key={status}
                            label={STATUS_STYLES[status].label}
                            count={statusCounts[status] || 0}
                            active={statusFilter === status}
                            onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                        />
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonDemoRow key={i} />
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '16px',
                        background: 'var(--color-error-bg)',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        color: 'var(--color-error-text)',
                        fontSize: '14px',
                        marginBottom: '24px',
                    }}>
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && demos.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '64px 32px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                    }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                            No demos yet
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                            Create your first AI demo agent to get started
                        </p>
                        <Link
                            href="/lab/new"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: 'var(--color-primary)',
                                color: '#FFFFFF',
                                borderRadius: '6px',
                                fontWeight: 500,
                                fontSize: '14px',
                                textDecoration: 'none',
                            }}
                        >
                            Create demo
                        </Link>
                    </div>
                )}

                {/* Demo List */}
                {!loading && demos.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {demos.map(demo => {
                            const statusStyle = STATUS_STYLES[demo.status] || STATUS_STYLES.draft;
                            const isDeleting = deletingId === demo.id;

                            return (
                                <div
                                    key={demo.id}
                                    className="lab-demo-row"
                                    style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        padding: '16px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        opacity: isDeleting ? 0.5 : 1,
                                        transition: 'opacity 150ms, box-shadow 150ms',
                                    }}
                                >
                                    {/* Logo / Avatar */}
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: demo.primary_color || 'var(--color-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}>
                                        {demo.company_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{
                                                fontSize: '15px',
                                                fontWeight: 500,
                                                color: 'var(--color-text-primary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {demo.company_name || 'Untitled demo'}
                                            </span>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                borderRadius: '9999px',
                                                background: statusStyle.bg,
                                                color: statusStyle.text,
                                                flexShrink: 0,
                                            }}>
                                                {statusStyle.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {demo.mission_profile && (
                                                <span>{MISSION_LABELS[demo.mission_profile] || demo.mission_profile}</span>
                                            )}
                                            <span>Updated {formatRelativeTime(demo.updated_at)}</span>
                                            {demo.status === 'active' && demo.expires_at && (
                                                <span>Expires {new Date(demo.expires_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="lab-demo-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        {demo.status === 'draft' && (
                                            <ActionButton
                                                label="Resume"
                                                onClick={() => router.push(`/lab/${demo.id}`)}
                                                primary
                                            />
                                        )}
                                        {demo.status === 'active' && (
                                            <>
                                                <ActionButton
                                                    label="Open"
                                                    onClick={() => window.open(getMagicLink(demo.id), '_blank')}
                                                    primary
                                                />
                                                <ActionButton
                                                    label="Copy link"
                                                    onClick={() => handleCopyLink(demo.id)}
                                                />
                                            </>
                                        )}
                                        <ActionButton
                                            label={isDeleting ? 'Deleting...' : 'Delete'}
                                            onClick={() => handleDelete(demo.id)}
                                            destructive
                                            disabled={isDeleting}
                                            loading={isDeleting}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Sub-components ---

function FilterTab({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                background: active ? 'var(--color-primary-highlight)' : 'var(--color-surface)',
                color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
            }}
        >
            {label}
            {count > 0 && (
                <span style={{
                    fontSize: '11px',
                    background: active ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                    color: active ? '#FFFFFF' : 'var(--color-text-muted)',
                    padding: '0 6px',
                    borderRadius: '9999px',
                    lineHeight: '18px',
                }}>
                    {count}
                </span>
            )}
        </button>
    );
}

function ActionButton({
    label,
    onClick,
    primary,
    destructive,
    disabled,
    loading,
}: {
    label: string;
    onClick: () => void;
    primary?: boolean;
    destructive?: boolean;
    disabled?: boolean;
    loading?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '6px',
                border: primary ? 'none' : '1px solid var(--color-border)',
                background: primary
                    ? 'var(--color-primary)'
                    : destructive
                        ? 'transparent'
                        : 'var(--color-surface)',
                color: primary
                    ? '#FFFFFF'
                    : destructive
                        ? 'var(--color-error)'
                        : 'var(--color-text-secondary)',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled || loading ? 0.5 : 1,
                transition: 'all 150ms',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
            }}
        >
            {loading && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ flexShrink: 0 }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {label}
        </button>
    );
}
