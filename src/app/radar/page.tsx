'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Radar, Users, Mail, TrendingUp, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface StatCard {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    href: string;
}

interface RecentCampaign {
    id: string;
    name: string;
    status: string;
    total_sent: number;
    open_rate: number;
    updated_at: string;
}

function statusBadgeVariant(status: string): 'live' | 'draft' | 'archived' | 'type' {
    switch (status) {
        case 'active': return 'live';
        case 'paused': return 'type';
        case 'archived': return 'archived';
        default: return 'draft';
    }
}

export default function RadarPage() {
    const [campaigns, setCampaigns] = useState<RecentCampaign[]>([]);
    const [analytics, setAnalytics] = useState<{
        totals?: { activeCampaigns: number; totalSent: number };
        avgOpenRate?: number;
    }>({});
    const [prospectCount, setProspectCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [camRes, anaRes, proRes] = await Promise.all([
                    fetch('/api/radar/campaigns?limit=5'),
                    fetch('/api/radar/analytics'),
                    fetch('/api/radar/prospects?limit=1'),
                ]);
                const camData = await camRes.json();
                const anaData = await anaRes.json();
                const proData = await proRes.json();

                setCampaigns(camData.campaigns || []);
                setAnalytics(anaData);
                setProspectCount(proData.total || 0);
            } catch (err) {
                console.error('RADAR dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const stats: StatCard[] = [
        {
            label: 'Active Campaigns',
            value: analytics.totals?.activeCampaigns ?? '—',
            icon: <Radar size={20} />,
            href: '/radar/campaigns',
        },
        {
            label: 'Total Prospects',
            value: prospectCount,
            icon: <Users size={20} />,
            href: '/radar/prospects',
        },
        {
            label: 'Emails Sent',
            value: analytics.totals?.totalSent ?? '—',
            icon: <Mail size={20} />,
            href: '/radar/campaigns',
        },
        {
            label: 'Avg Open Rate',
            value: analytics.avgOpenRate != null ? `${analytics.avgOpenRate}%` : '—',
            icon: <TrendingUp size={20} />,
            href: '/radar/campaigns',
        },
    ];

    return (
        <InternalAppShell title="RADAR" subtitle="Prospecting & outreach engine">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <section className="mb-12">
                    <h2 className="mb-2 text-4xl font-semibold leading-tight tracking-tight text-foreground">
                        Outreach Hub
                    </h2>
                    <p className="mb-8 max-w-2xl text-sm font-normal leading-normal text-foreground-secondary">
                        Find and warm leads via multi-step email sequences before they enter a demo flow.
                    </p>
                </section>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <section className="mb-10">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {stats.map((s) => (
                                    <Link key={s.label} href={s.href}>
                                        <Card variant="interactive" padding="lg" className="transition-all hover:shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary [&_svg]:text-white">
                                                    {s.icon}
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                                                    <p className="text-sm text-foreground-secondary">{s.label}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Recent Campaigns */}
                        <section className="mb-10">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-medium text-foreground">Recent Campaigns</h3>
                                <div className="flex gap-2">
                                    <Link href="/radar/campaigns/new">
                                        <Button variant="primary" size="sm">
                                            <Plus size={14} className="mr-1" /> New Campaign
                                        </Button>
                                    </Link>
                                    <Link href="/radar/campaigns">
                                        <Button variant="ghost" size="sm">
                                            View all <ArrowRight size={14} className="ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            {campaigns.length === 0 ? (
                                <Card variant="default" padding="lg">
                                    <p className="text-sm text-foreground-secondary">
                                        No campaigns yet. Create one to start sending outreach sequences.
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {campaigns.map((c) => (
                                        <Link key={c.id} href={`/radar/campaigns/${c.id}`}>
                                            <Card variant="interactive" padding="md" className="transition-all hover:shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Radar size={16} className="text-foreground-secondary" />
                                                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-foreground-tertiary">
                                                            {c.total_sent} sent
                                                        </span>
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
                        </section>

                        {/* Quick Actions */}
                        <section>
                            <h3 className="mb-4 text-xl font-medium text-foreground">Quick Actions</h3>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/radar/prospects/import">
                                    <Button variant="secondary" size="sm">
                                        Import Prospects (CSV)
                                    </Button>
                                </Link>
                                <Link href="/radar/prospects/new">
                                    <Button variant="secondary" size="sm">
                                        Add Prospect
                                    </Button>
                                </Link>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </InternalAppShell>
    );
}
