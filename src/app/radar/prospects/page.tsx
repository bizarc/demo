'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Search, Upload, Loader2 } from 'lucide-react';
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
    score: number;
    status: string;
    tags: string[];
    created_at: string;
}

const STATUS_TABS = ['all', 'active', 'unsubscribed', 'bounced', 'archived'];

function statusBadgeVariant(status: string): 'live' | 'draft' | 'archived' | 'type' {
    switch (status) {
        case 'active': return 'live';
        case 'unsubscribed': return 'type';
        case 'bounced': return 'archived';
        default: return 'draft';
    }
}

export default function ProspectsPage() {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '50' });
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

    const selectAll = () => {
        setSelected(new Set(prospects.map((p) => p.id)));
    };

    return (
        <InternalAppShell title="RADAR — Prospects" subtitle="Outbound targets">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-foreground">Prospects</h2>
                        <p className="mt-1 text-sm text-foreground-secondary">{total} total</p>
                    </div>
                    <div className="flex gap-2">
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

                {/* Filter tabs */}
                <div className="mb-4 flex gap-1 border-b border-border">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setStatusFilter(tab); setSelected(new Set()); }}
                            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                                statusFilter === tab
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-foreground-secondary hover:text-foreground'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
                        <Input
                            placeholder="Search name, email, company…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    {selected.size > 0 && (
                        <span className="text-sm text-foreground-secondary">
                            {selected.size} selected
                        </span>
                    )}
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
                                No prospects found. Import a CSV or add prospects manually.
                            </p>
                            <Link href="/radar/prospects/import">
                                <Button variant="primary" size="sm">Import CSV</Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <>
                        <div className="mb-2 flex items-center gap-2">
                            <button onClick={selectAll} className="text-xs text-foreground-secondary hover:text-foreground">
                                Select all
                            </button>
                        </div>
                        <div className="space-y-2">
                            {prospects.map((p) => (
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
                                                            {[p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || 'Unknown'}
                                                        </p>
                                                        <p className="text-xs text-foreground-secondary">
                                                            {[p.title, p.company_name].filter(Boolean).join(' at ') || p.email || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {p.tags?.slice(0, 2).map((tag) => (
                                                        <span key={tag} className="rounded px-1.5 py-0.5 bg-canvas-secondary text-xs text-foreground-secondary">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {p.score > 0 && (
                                                        <span className="text-xs font-medium text-foreground-secondary">
                                                            Score: {p.score}
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
                            ))}
                        </div>
                    </>
                )}
            </main>
        </InternalAppShell>
    );
}
