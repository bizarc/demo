'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Database, FileSearch, BookOpen, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface StatCard {
    label: string;
    value: number;
    icon: React.ReactNode;
    href: string;
}

interface RecentRecord {
    id: string;
    title: string;
    status: string;
    updated_at: string;
}

interface RecentKB {
    id: string;
    name: string;
    type: string;
    status: string;
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

export default function ReconPage() {
    const [records, setRecords] = useState<RecentRecord[]>([]);
    const [kbs, setKbs] = useState<RecentKB[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [resRes, kbRes] = await Promise.all([
                    fetch('/api/recon/research?limit=5'),
                    fetch('/api/knowledge-base'),
                ]);
                const resData = await resRes.json();
                const kbData = await kbRes.json();
                setRecords(resData.records || []);
                setKbs((kbData.knowledgeBases || []).slice(0, 5));
            } catch (err) {
                console.error('RECON dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const stats: StatCard[] = [
        {
            label: 'Research Records',
            value: records.length,
            icon: <FileSearch size={20} />,
            href: '/recon/research',
        },
        {
            label: 'Knowledge Bases',
            value: kbs.length,
            icon: <Database size={20} />,
            href: '/recon/kb',
        },
    ];

    return (
        <InternalAppShell title="RECON" subtitle="Shared intelligence & research">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <section className="mb-12">
                    <h2 className="mb-2 text-4xl font-semibold leading-tight tracking-tight text-foreground">
                        Intelligence Hub
                    </h2>
                    <p className="mb-8 max-w-2xl text-sm font-normal leading-normal text-foreground-secondary">
                        Manage research records and knowledge bases used across THE LAB, RADAR, and BLUEPRINT.
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
                            <div className="grid gap-4 sm:grid-cols-2">
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

                        {/* Recent Research */}
                        <section className="mb-10">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-medium text-foreground">Recent Research</h3>
                                <div className="flex gap-2">
                                    <Link href="/recon/research/new">
                                        <Button variant="primary" size="sm">
                                            <Plus size={14} className="mr-1" /> New Research
                                        </Button>
                                    </Link>
                                    <Link href="/recon/research">
                                        <Button variant="ghost" size="sm">
                                            View all <ArrowRight size={14} className="ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            {records.length === 0 ? (
                                <Card variant="default" padding="lg">
                                    <p className="text-sm text-foreground-secondary">
                                        No research records yet. Create one with New Research or run AI research from
                                        THE LAB.
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {records.map((r) => (
                                        <Link key={r.id} href={`/recon/research/${r.id}`}>
                                            <Card variant="interactive" padding="md" className="transition-all hover:shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <FileSearch size={16} className="text-foreground-secondary" />
                                                        <span className="text-sm font-medium text-foreground">{r.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={statusBadgeVariant(r.status)} size="sm">
                                                            {r.status}
                                                        </Badge>
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
                        </section>

                        {/* Knowledge Bases */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-medium text-foreground">Knowledge Bases</h3>
                                <div className="flex gap-2">
                                    <Link href="/recon/kb/new">
                                        <Button variant="primary" size="sm">
                                            <Plus size={14} className="mr-1" /> New KB
                                        </Button>
                                    </Link>
                                    <Link href="/recon/kb">
                                        <Button variant="ghost" size="sm">
                                            View all <ArrowRight size={14} className="ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            {kbs.length === 0 ? (
                                <Card variant="default" padding="lg">
                                    <p className="text-sm text-foreground-secondary">
                                        No knowledge bases yet. Create one to store reusable documents and context.
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {kbs.map((kb) => (
                                        <Link key={kb.id} href={`/recon/kb/${kb.id}`}>
                                            <Card variant="interactive" padding="md" className="transition-all hover:shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen size={16} className="text-foreground-secondary" />
                                                        <span className="text-sm font-medium text-foreground">{kb.name}</span>
                                                        <span className="text-xs text-foreground-tertiary">{kb.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={statusBadgeVariant(kb.status)} size="sm">
                                                            {kb.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </InternalAppShell>
    );
}
