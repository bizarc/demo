'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    Search, Users, Mail, AlertCircle, Sparkles, ArrowRight,
    Loader2, Plus, Clock,
} from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PipelineStats {
    noEmail: number;
    readyToContact: number;
    warmSignals: number;
    interested: number;
}

interface Session {
    id: string;
    query: string;
    result_count: number;
    imported_count: number;
    created_at: string;
}

export default function RadarPage() {
    const [pipeline, setPipeline] = useState<PipelineStats>({
        noEmail: 0,
        readyToContact: 0,
        warmSignals: 0,
        interested: 0,
    });
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [proRes, sessRes] = await Promise.all([
                    fetch('/api/radar/prospects?limit=1000'),
                    fetch('/api/radar/discover/sessions'),
                ]);
                const proData = await proRes.json();
                const sessData = await sessRes.json();

                const prospects: any[] = proData.prospects || [];
                setPipeline({
                    noEmail: prospects.filter((p) => !p.email).length,
                    readyToContact: prospects.filter((p) => p.email && p.status === 'active').length,
                    warmSignals: proData.warmSignals || 0,
                    interested: prospects.filter((p) => p.tags?.includes('interested')).length,
                });
                setSessions((sessData.sessions || []).slice(0, 5));
            } catch (err) {
                console.error('RADAR dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const pipelineCards = [
        {
            label: 'No Email Found',
            value: pipeline.noEmail,
            icon: <AlertCircle size={18} />,
            href: '/radar/prospects?status=new',
            description: 'Need enrichment',
            color: 'text-amber-500',
            bg: 'bg-amber-50',
        },
        {
            label: 'Ready to Contact',
            value: pipeline.readyToContact,
            icon: <Mail size={18} />,
            href: '/radar/prospects?status=active',
            description: 'Email found, not enrolled',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Warm Signals',
            value: pipeline.warmSignals,
            icon: <Sparkles size={18} />,
            href: '/radar/prospects',
            description: 'Opened or clicked',
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            label: 'Interested',
            value: pipeline.interested,
            icon: <Users size={18} />,
            href: '/radar/prospects',
            description: 'Ready for LAB handoff',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    ];

    return (
        <InternalAppShell title="RADAR" subtitle="Prospecting & outreach engine">
            <main className="mx-auto max-w-6xl px-6 py-10">
                {/* Header */}
                <section className="mb-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="mb-2 text-4xl font-semibold leading-tight tracking-tight text-foreground">
                                RADAR
                            </h2>
                            <p className="max-w-2xl text-sm font-normal leading-normal text-foreground-secondary">
                                Find businesses, get their contact info, send personalized outreach, hand warm prospects to THE LAB.
                            </p>
                        </div>
                        <Link href="/radar/discover">
                            <Button variant="primary">
                                <Search size={15} className="mr-2" />
                                Start Discovery
                            </Button>
                        </Link>
                    </div>
                </section>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-foreground-secondary" />
                    </div>
                ) : (
                    <>
                        {/* Pipeline */}
                        <section className="mb-10">
                            <h3 className="mb-4 text-lg font-medium text-foreground">Pipeline</h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {pipelineCards.map((card) => (
                                    <Link key={card.label} href={card.href}>
                                        <Card variant="interactive" padding="lg" className="transition-all hover:shadow-sm">
                                            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md ${card.bg} ${card.color}`}>
                                                {card.icon}
                                            </div>
                                            <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                                            <p className="text-sm font-medium text-foreground">{card.label}</p>
                                            <p className="mt-0.5 text-xs text-foreground-secondary">{card.description}</p>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Recent discovery sessions */}
                        <section className="mb-10">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-foreground">Recent Discovery Sessions</h3>
                                <Link href="/radar/discover">
                                    <Button variant="ghost" size="sm">
                                        New search <ArrowRight size={13} className="ml-1" />
                                    </Button>
                                </Link>
                            </div>
                            {sessions.length === 0 ? (
                                <Card variant="default" padding="lg">
                                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                                        <Search size={28} className="text-foreground-secondary" />
                                        <p className="text-sm text-foreground-secondary">
                                            No searches yet. Start by discovering businesses in your target niche.
                                        </p>
                                        <Link href="/radar/discover">
                                            <Button variant="primary" size="sm">
                                                <Search size={14} className="mr-1" /> Start Discovery
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {sessions.map((s) => (
                                        <Card key={s.id} variant="default" padding="md">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Search size={14} className="flex-shrink-0 text-foreground-secondary" />
                                                    <span className="text-sm font-medium text-foreground">{s.query}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-foreground-secondary">
                                                    <span>{s.result_count} found</span>
                                                    <span>{s.imported_count} imported</span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock size={11} />
                                                        {new Date(s.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Quick actions */}
                        <section>
                            <h3 className="mb-4 text-lg font-medium text-foreground">Quick Actions</h3>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/radar/campaigns/new">
                                    <Button variant="secondary" size="sm">
                                        <Plus size={14} className="mr-1" /> New Campaign
                                    </Button>
                                </Link>
                                <Link href="/radar/prospects/import">
                                    <Button variant="secondary" size="sm">
                                        Import Prospects (CSV)
                                    </Button>
                                </Link>
                                <Link href="/radar/prospects/new">
                                    <Button variant="secondary" size="sm">
                                        Add Prospect Manually
                                    </Button>
                                </Link>
                                <Link href="/radar/campaigns">
                                    <Button variant="secondary" size="sm">
                                        View Campaigns
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
