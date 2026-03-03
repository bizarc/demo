'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Plus, Search, Upload, Loader2, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Prospect {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    title: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    score: number;
    status: string;
    tags: string[];
    created_at: string;
}

const STATUS_TABS = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New (No Email)' },
    { value: 'active', label: 'Active' },
    { value: 'unsubscribed', label: 'Unsubscribed' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'archived', label: 'Archived' },
];

function statusBadgeVariant(status: string): 'live' | 'draft' | 'archived' | 'type' {
    switch (status) {
        case 'active': return 'live';
        case 'new': return 'draft';
        case 'unsubscribed': return 'type';
        case 'bounced': return 'archived';
        default: return 'draft';
    }
}

export default function ProspectsPage() {
    const searchParams = useSearchParams();
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [enrichingAll, setEnrichingAll] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (search) params.set('search', search);
            const res = await fetch(`/api/radar/prospects?${params}`);
            const data = await res.json();
            setProspects(data.prospects || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Prospects load error:', err);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(prospects.map((p) => p.id)));

    // Enrich all 'new' prospects (those without email)
    const handleEnrichAll = async () => {
        const targets = prospects.filter((p) => !p.email && p.status === 'new');
        if (targets.length === 0) return;

        setEnrichingAll(true);
        let done = 0;

        for (const p of targets) {
            setEnrichProgress(`Enriching ${done + 1} of ${targets.length}…`);
            try {
                await fetch(`/api/radar/prospects/${p.id}/enrich`, { method: 'POST' });
            } catch {
                // continue on error
            }
            done++;
        }

        setEnrichProgress(null);
        setEnrichingAll(false);
        load();
    };

    const noEmailCount = prospects.filter((p) => !p.email).length;

    return (
        <InternalAppShell title="RADAR — Prospects" subtitle="Outbound pipeline">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-foreground">Prospects</h2>
                        <p className="mt-1 text-sm text-foreground-secondary">{total} total</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/radar/discover">
                            <Button variant="secondary" size="sm">
                                <Search size={14} className="mr-1" /> Discover
                            </Button>
                        </Link>
                        <Link href="/radar/prospects/import">
                            <Button variant="secondary" size="sm">
                                <Upload size={14} className="mr-1" /> Import CSV
                            </Button>
                        </Link>
                        <Link href="/radar/prospects/new">
                            <Button variant="primary" size="sm">
                                <Plus size={14} className="mr-1" /> Add Prospect
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Enrich All banner */}
                {noEmailCount > 0 && statusFilter !== 'active' && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-amber-600" />
                            <span className="text-sm text-amber-800">
                                {noEmailCount} prospect{noEmailCount > 1 ? 's' : ''} without email address.
                                {' '}Run enrichment to find emails automatically.
                            </span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleEnrichAll}
                            disabled={enrichingAll}
                        >
                            {enrichingAll ? (
                                <>
                                    <Loader2 size={13} className="animate-spin mr-1" />
                                    {enrichProgress || 'Enriching…'}
                                </>
                            ) : (
                                <>
                                    <Sparkles size={13} className="mr-1" />
                                    Enrich All ({noEmailCount})
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Filter tabs */}
                <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => { setStatusFilter(tab.value); setSelected(new Set()); }}
                            className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === tab.value
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-foreground-secondary hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
                        <Input
                            placeholder="Search name, company…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Bulk actions */}
                {selected.size > 0 && (
                    <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-canvas-secondary px-4 py-2">
                        <span className="text-sm text-foreground">{selected.size} selected</span>
                        <Link href={`/radar/campaigns?enroll=${Array.from(selected).join(',')}`}>
                            <Button variant="primary" size="sm">Enroll in Campaign</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                            Clear
                        </Button>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                    </div>
                ) : prospects.length === 0 ? (
                    <Card variant="default" padding="lg">
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <Users size={32} className="text-foreground-secondary" />
                            <p className="text-sm text-foreground-secondary">
                                No prospects found.{' '}
                                <Link href="/radar/discover" className="text-primary hover:underline">
                                    Start a discovery search
                                </Link>{' '}
                                or import a CSV.
                            </p>
                            <Link href="/radar/discover">
                                <Button variant="primary" size="sm">
                                    <Search size={14} className="mr-1" /> Discover Businesses
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <>
                        <div className="mb-2 flex items-center gap-2">
                            <button
                                onClick={selectAll}
                                className="text-xs text-foreground-secondary hover:text-foreground"
                            >
                                Select all
                            </button>
                        </div>
                        <div className="space-y-2">
                            {prospects.map((p) => {
                                const displayName =
                                    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
                                    p.company_name ||
                                    'Unknown';
                                const subline = p.company_name
                                    ? [p.city, p.state].filter(Boolean).join(', ') || p.company_name
                                    : [p.city, p.state].filter(Boolean).join(', ');

                                return (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(p.id)}
                                            onChange={() => toggleSelect(p.id)}
                                            className="h-4 w-4 rounded border-border"
                                        />
                                        <Link href={`/radar/prospects/${p.id}`} className="flex-1">
                                            <Card variant="interactive" padding="md" className="transition-all hover:shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {displayName}
                                                            </p>
                                                            {subline && (
                                                                <p className="text-xs text-foreground-secondary">{subline}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Email indicator */}
                                                        {p.email ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                                                                <Mail size={10} /> Email
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                                                <AlertCircle size={10} /> No email
                                                            </span>
                                                        )}
                                                        {p.tags?.includes('interested') && (
                                                            <span className="rounded px-1.5 py-0.5 bg-purple-50 text-xs text-purple-700">
                                                                Interested
                                                            </span>
                                                        )}
                                                        <Badge variant={statusBadgeVariant(p.status)} size="sm">
                                                            {p.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </InternalAppShell>
    );
}
