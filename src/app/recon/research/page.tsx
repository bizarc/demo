'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileSearch, ArrowLeft, Loader2, Plus } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ResearchRecord {
    id: string;
    title: string;
    summary: string;
    status: string;
    source: string;
    confidence_score: number | null;
    offerings: string[];
    competitors: string[];
    created_at: string;
    updated_at: string;
    research_type?: string | null;
    skill_key?: string | null;
}

function statusBadgeVariant(status: string): 'live' | 'draft' | 'archived' | 'type' {
    switch (status) {
        case 'approved': return 'live';
        case 'reviewed': return 'type';
        case 'archived': return 'archived';
        default: return 'draft';
    }
}

export default function ResearchListPage() {
    const [records, setRecords] = useState<ResearchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [researchTypeFilter, setResearchTypeFilter] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (statusFilter) params.set('status', statusFilter);
                if (researchTypeFilter) params.set('research_type', researchTypeFilter);
                params.set('limit', '50');

                const res = await fetch(`/api/recon/research?${params}`);
                const data = await res.json();
                setRecords(data.records || []);
                setTotal(data.total || 0);
            } catch (err) {
                console.error('Research list error:', err);
            } finally {
                setLoading(false);
            }
        }
        const timer = setTimeout(load, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter, researchTypeFilter]);

    const statuses = ['', 'draft', 'reviewed', 'approved', 'archived'];
    const researchTypes = [
        { value: '', label: 'All types' },
        { value: 'company', label: 'Company' },
        { value: 'industry', label: 'Industry' },
        { value: 'function', label: 'Function' },
        { value: 'technology', label: 'Technology' },
    ];

    return (
        <InternalAppShell title="RECON" subtitle="Research Records">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/recon">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={14} className="mr-1" /> Back
                            </Button>
                        </Link>
                        <h2 className="text-2xl font-semibold text-foreground">Research Records</h2>
                        <span className="text-sm text-foreground-secondary">({total})</span>
                    </div>
                    <Link href="/recon/research/new">
                        <Button variant="primary" size="sm">
                            <Plus size={14} className="mr-1" /> New Research
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        id="recon-research-search"
                        placeholder="Search by title or summary..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64"
                    />
                    <select
                        value={researchTypeFilter}
                        onChange={(e) => setResearchTypeFilter(e.target.value)}
                        className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        {researchTypes.map((opt) => (
                            <option key={opt.value || 'all'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-1">
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
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                    </div>
                ) : records.length === 0 ? (
                    <Card variant="default" padding="lg">
                        <p className="text-sm text-foreground-secondary">
                            No research records found. Create one with New Research or run AI research from THE LAB.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {records.map((r) => (
                            <Link key={r.id} href={`/recon/research/${r.id}`}>
                                <Card variant="interactive" padding="md" className="transition-all hover:shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <FileSearch size={16} className="flex-shrink-0 text-foreground-secondary" />
                                                <span className="text-sm font-medium text-foreground">{r.title}</span>
                                                {r.research_type && (
                                                    <Badge variant="type" size="sm">
                                                        {r.research_type.replace('_', ' ')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="truncate text-xs text-foreground-tertiary">{r.summary}</p>
                                            {r.offerings.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {r.offerings.slice(0, 3).map((o, i) => (
                                                        <span key={i} className="inline-block rounded bg-surface-raised px-1.5 py-0.5 text-xs text-foreground-secondary">
                                                            {o}
                                                        </span>
                                                    ))}
                                                    {r.offerings.length > 3 && (
                                                        <span className="text-xs text-foreground-tertiary">+{r.offerings.length - 3} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                            <Badge variant={statusBadgeVariant(r.status)} size="sm">
                                                {r.status}
                                            </Badge>
                                            {r.confidence_score !== null && (
                                                <span className="text-xs text-foreground-tertiary">
                                                    {Math.round(r.confidence_score * 100)}% conf.
                                                </span>
                                            )}
                                            <span className="text-xs text-foreground-tertiary">
                                                {new Date(r.updated_at).toLocaleDateString()}
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
