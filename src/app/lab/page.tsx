'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCreatorId } from '@/lib/useCreatorId';
import { useToast } from '@/components/ui/Toast';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { SkeletonDemoRow } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { trackUxEvent } from '@/lib/uxMetrics';

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

const STATUS_META: Record<
    DemoListItem['status'],
    { label: string; variant: 'live' | 'draft' | 'archived' | 'type' }
> = {
    draft: { label: 'Draft', variant: 'draft' },
    active: { label: 'Active', variant: 'live' },
    expired: { label: 'Expired', variant: 'archived' },
    blueprint: { label: 'Blueprint', variant: 'type' },
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
    const creatorId = useCreatorId();
    const [demos, setDemos] = useState<DemoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [pushingId, setPushingId] = useState<string | null>(null);

    const loadDemos = useCallback(async () => {
        if (!creatorId) return;

        try {
            const params = new URLSearchParams();
            if (creatorId) params.set('created_by', creatorId);
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
    }, [creatorId, statusFilter, addToast]);

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
            trackUxEvent('lab_demo_deleted', { demoId: id });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to delete';
            addToast({ title: 'Delete failed', description: msg, variant: 'error' });
            trackUxEvent('lab_demo_delete_failed', { demoId: id, error: msg });
        } finally {
            setDeletingId(null);
        }
    };

    const handlePushToBlueprint = async (id: string) => {
        if (!confirm('Push this demo to BLUEPRINT? It will be marked for production configuration.')) return;
        setPushingId(id);
        try {
            const res = await fetchWithRetry(`/api/demo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'blueprint' }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to push');
            }
            setDemos(prev => prev.map(d => d.id === id ? { ...d, status: 'blueprint' as const } : d));
            addToast({ title: 'Pushed to BLUEPRINT', description: 'Demo is ready for production configuration.', variant: 'success' });
            trackUxEvent('lab_demo_pushed_blueprint', { demoId: id });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to push';
            addToast({ title: 'Push failed', description: msg, variant: 'error' });
            trackUxEvent('lab_demo_push_failed', { demoId: id, error: msg });
        } finally {
            setPushingId(null);
        }
    };

    const getMagicLink = (id: string) => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/demo/${id}`;
    };

    const handleCopyLink = async (id: string) => {
        try {
            await navigator.clipboard.writeText(getMagicLink(id));
            addToast({ title: 'Copied', description: 'Magic link copied to clipboard.', variant: 'success' });
            trackUxEvent('lab_magic_link_copied', { demoId: id });
        } catch {
            addToast({ title: 'Copy failed', description: 'Could not copy link in this browser.', variant: 'error' });
            trackUxEvent('lab_magic_link_copy_failed', { demoId: id });
        }
    };

    const statusCounts = demos.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8">
                {/* Status Filter Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
                <FilterTab
                    label="All"
                    count={demos.length}
                    active={statusFilter === null}
                    onClick={() => setStatusFilter(null)}
                />
                {(['draft', 'active', 'expired', 'blueprint'] as const).map(status => (
                    <FilterTab
                        key={status}
                        label={STATUS_META[status].label}
                        count={statusCounts[status] || 0}
                        active={statusFilter === status}
                        onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                    />
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonDemoRow key={i} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <Card variant="default" padding="md" className="mb-6 border-error/20 bg-error-bg">
                    <p className="text-sm text-error-text">{error}</p>
                </Card>
            )}

            {/* Empty State */}
            {!loading && !error && demos.length === 0 && (
                <Card variant="default" padding="lg">
                    <EmptyState
                        title="No demos yet"
                        description="Create your first AI demo agent to get started."
                        action={
                            <Link href="/lab/new">
                                <Button variant="primary" size="md" className="gap-2">
                                    <Plus size={16} />
                                    Create demo
                                </Button>
                            </Link>
                        }
                    />
                </Card>
            )}

            {/* Demo List */}
            {!loading && demos.length > 0 && (
                <div className="flex flex-col gap-3">
                    {demos.map(demo => {
                        const statusMeta = STATUS_META[demo.status] || STATUS_META.draft;
                        const isDeleting = deletingId === demo.id;

                        return (
                            <Card
                                key={demo.id}
                                variant="default"
                                padding="md"
                                className={`transition-opacity ${isDeleting ? 'opacity-50' : 'opacity-100'}`}
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                    {/* Logo / Avatar */}
                                    <div
                                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-base font-semibold text-white"
                                        style={{ background: demo.primary_color || 'var(--color-primary)' }}
                                        aria-label={`${demo.company_name || 'Untitled demo'} avatar`}
                                    >
                                        {demo.company_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="truncate text-[15px] font-medium text-foreground">
                                                {demo.company_name || 'Untitled demo'}
                                            </span>
                                            <Badge
                                                variant={statusMeta.variant}
                                                size="sm"
                                            >
                                                {statusMeta.label}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-foreground-secondary">
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
                                    <div className="flex flex-wrap gap-2 md:ml-auto md:flex-nowrap">
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
                                                <ActionButton
                                                    label={pushingId === demo.id ? 'Pushing...' : 'Push to BLUEPRINT'}
                                                    onClick={() => handlePushToBlueprint(demo.id)}
                                                    disabled={!!pushingId}
                                                    loading={pushingId === demo.id}
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
                            </Card>
                        );
                    })}
                </div>
            )}
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
        <Button
            type="button"
            onClick={onClick}
            variant={active ? 'ghost' : 'secondary'}
            size="sm"
            className={active ? 'border border-primary bg-primary-highlight text-primary' : ''}
        >
            {label}
            {count > 0 && (
                <span className={`rounded-full px-1.5 text-[11px] leading-[18px] ${active ? 'bg-primary text-white' : 'bg-border-subtle text-foreground-muted'}`}>
                    {count}
                </span>
            )}
        </Button>
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
        <Button
            type="button"
            onClick={onClick}
            loading={loading}
            disabled={disabled}
            variant={primary ? 'primary' : destructive ? 'ghost' : 'secondary'}
            size="sm"
            className={destructive ? 'text-error hover:bg-error-bg hover:text-error' : ''}
        >
            {label}
        </Button>
    );
}
