'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Radar, Plus, Search, Loader2 } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Campaign {
    id: string;
    name: string;
    status: string;
    outreach_goal: string | null;
    target_niche: string | null;
    channel: string;
    daily_send_limit: number;
    updated_at: string;
}

const STATUS_TABS = ['all', 'draft', 'active', 'paused', 'completed', 'archived'];

function statusBadgeVariant(status: string): 'live' | 'draft' | 'archived' | 'type' {
    switch (status) {
        case 'active': return 'live';
        case 'paused': return 'type';
        case 'completed': case 'archived': return 'archived';
        default: return 'draft';
    }
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (search) params.set('search', search);
            const res = await fetch(`/api/radar/campaigns?${params}`);
            const data = await res.json();
            setCampaigns(data.campaigns || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Campaigns load error:', err);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { load(); }, [load]);

    return (
        <InternalAppShell title="RADAR — Campaigns" subtitle="Email outreach campaigns">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-foreground">Campaigns</h2>
                        <p className="mt-1 text-sm text-foreground-secondary">{total} total</p>
                    </div>
                    <Link href="/radar/campaigns/new">
                        <Button variant="primary" size="sm">
                            <Plus size={14} className="mr-1" /> New Campaign
                        </Button>
                    </Link>
                </div>

                {/* Filter tabs */}
                <div className="mb-4 flex gap-1 border-b border-border">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
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
                <div className="mb-4 relative max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
                    <Input
                        placeholder="Search campaigns…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <Card variant="default" padding="lg">
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <Radar size={32} className="text-foreground-secondary" />
                            <p className="text-sm text-foreground-secondary">
                                No campaigns yet. Create your first outreach campaign.
                            </p>
                            <Link href="/radar/campaigns/new">
                                <Button variant="primary" size="sm">New Campaign</Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {campaigns.map((c) => (
                            <Link key={c.id} href={`/radar/campaigns/${c.id}`}>
                                <Card variant="interactive" padding="md" className="transition-all hover:shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Radar size={16} className="text-foreground-secondary" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{c.name}</p>
                                                <p className="text-xs text-foreground-secondary">
                                                    {c.target_niche || c.outreach_goal || c.channel} · limit {c.daily_send_limit}/day
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={statusBadgeVariant(c.status)} size="sm">
                                                {c.status}
                                            </Badge>
                                            <span className="text-xs text-foreground-tertiary">
                                                {new Date(c.updated_at).toLocaleDateString()}
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
