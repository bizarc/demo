'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Database, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface KnowledgeBase {
    id: string;
    name: string;
    type: string;
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

function statusBadgeVariant(status: string): 'live' | 'draft' | 'archived' | 'type' {
    switch (status) {
        case 'approved': return 'live';
        case 'reviewed': return 'type';
        case 'archived': return 'archived';
        default: return 'draft';
    }
}

export default function KBListPage() {
    const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (statusFilter) params.set('status', statusFilter);

                const res = await fetch(`/api/knowledge-base?${params}`);
                const data = await res.json();
                setKbs(data.knowledgeBases || []);
            } catch (err) {
                console.error('KB list error:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [statusFilter]);

    const statuses = ['', 'draft', 'reviewed', 'approved', 'archived'];

    return (
        <InternalAppShell title="RECON" subtitle="Knowledge Bases">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/recon">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={14} className="mr-1" /> Back
                            </Button>
                        </Link>
                        <h2 className="text-2xl font-semibold text-foreground">Knowledge Bases</h2>
                        <span className="text-sm text-foreground-secondary">({kbs.length})</span>
                    </div>
                    <Link href="/recon/kb/new">
                        <Button variant="primary" size="sm">
                            <Plus size={14} className="mr-1" /> New KB
                        </Button>
                    </Link>
                </div>

                {/* Status filter */}
                <div className="mb-6 flex gap-1">
                    {statuses.map((s) => (
                        <Button
                            key={s || 'all'}
                            variant={statusFilter === s ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setStatusFilter(s)}
                        >
                            {s || 'All'}
                        </Button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                    </div>
                ) : kbs.length === 0 ? (
                    <Card variant="default" padding="lg">
                        <p className="text-sm text-foreground-secondary">
                            No knowledge bases found. Create one to store reusable documents and context.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {kbs.map((kb) => (
                            <Link key={kb.id} href={`/recon/kb/${kb.id}`}>
                                <Card variant="interactive" padding="md" className="transition-all hover:shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <Database size={16} className="flex-shrink-0 text-foreground-secondary" />
                                                <span className="text-sm font-medium text-foreground">{kb.name}</span>
                                                <span className="rounded bg-surface-raised px-1.5 py-0.5 text-xs text-foreground-tertiary">
                                                    {kb.type}
                                                </span>
                                            </div>
                                            {kb.description && (
                                                <p className="truncate text-xs text-foreground-tertiary">{kb.description}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                            <Badge variant={statusBadgeVariant(kb.status)} size="sm">
                                                {kb.status}
                                            </Badge>
                                            <span className="text-xs text-foreground-tertiary">
                                                {new Date(kb.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </InternalAppShell>
    );
}
