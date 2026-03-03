'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, MapPin, Star, Globe, Phone,
    Loader2, CheckSquare, Square, ArrowRight, Clock,
} from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    phone: string | null;
    website: string | null;
    rating: number | null;
    review_count: number | null;
    city: string | null;
    state: string | null;
}

interface Session {
    id: string;
    query: string;
    result_count: number;
    imported_count: number;
    created_at: string;
}

export default function DiscoverPage() {
    const router = useRouter();
    const [niche, setNiche] = useState('');
    const [location, setLocation] = useState('');
    const [query, setQuery] = useState('');
    const [useAdvanced, setUseAdvanced] = useState(true);

    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sourceLabel, setSourceLabel] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    const loadSessions = useCallback(() => {
        fetch('/api/radar/discover/sessions')
            .then((r) => r.json())
            .then((d) => setSessions(d.sessions || []))
            .catch(() => {})
            .finally(() => setSessionsLoading(false));
    }, []);

    useEffect(() => { loadSessions(); }, [loadSessions]);

    const handleSearch = async () => {
        const finalQuery = useAdvanced
            ? [niche, location].filter(Boolean).join(' in ')
            : query;
        if (!finalQuery.trim()) {
            setError('Enter a search query');
            return;
        }
        setError(null);
        setSearching(true);
        setResults([]);
        setSelected(new Set());
        try {
            const res = await fetch('/api/radar/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    useAdvanced ? { niche, location } : { query }
                ),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');
            setResults(data.results || []);
            setSessionId(data.session_id || null);
            setSourceLabel(data.source === 'ai' ? 'AI (no Places API key)' : 'Google Places');
            loadSessions(); // refresh past searches list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === results.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(results.map((r) => r.place_id)));
        }
    };

    const handleImport = async () => {
        const toImport = results.filter((r) => selected.has(r.place_id));
        if (toImport.length === 0) return;
        setImporting(true);
        setError(null);
        try {
            const res = await fetch('/api/radar/discover/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ places: toImport, session_id: sessionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');
            if (data.imported === 0) {
                const detail = data.db_error ? ` DB: ${data.db_error}` : '';
                throw new Error(
                    `No prospects were imported (${data.skipped} skipped — may already exist or lack a phone number).${detail}`
                );
            }
            router.push(`/radar/prospects`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
            setImporting(false);
        }
    };

    return (
        <InternalAppShell title="RADAR — Discover" subtitle="Find businesses to target">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-6">
                    <Link href="/radar" className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground">
                        <ArrowLeft size={14} /> Back to RADAR
                    </Link>
                </div>

                <h2 className="mb-2 text-3xl font-semibold text-foreground">Discover Businesses</h2>
                <p className="mb-8 text-sm text-foreground-secondary">
                    Search for businesses by niche and location. Select targets to import into your prospect pipeline.
                </p>

                {/* Search form */}
                <Card variant="default" padding="lg" className="mb-8">
                    <div className="mb-4 flex items-center gap-3">
                        <button
                            className={`text-sm font-medium ${useAdvanced ? 'text-primary' : 'text-foreground-secondary hover:text-foreground'}`}
                            onClick={() => setUseAdvanced(true)}
                        >
                            Niche + Location
                        </button>
                        <span className="text-foreground-tertiary">|</span>
                        <button
                            className={`text-sm font-medium ${!useAdvanced ? 'text-primary' : 'text-foreground-secondary hover:text-foreground'}`}
                            onClick={() => setUseAdvanced(false)}
                        >
                            Free Search
                        </button>
                    </div>

                    {useAdvanced ? (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="mb-1 block text-xs font-medium text-foreground-secondary">Niche / Business Type</label>
                                <Input
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    placeholder="Roofers, Dentists, HVAC contractors…"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="mb-1 block text-xs font-medium text-foreground-secondary">Location</label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Austin TX, Chicago IL…"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button variant="primary" onClick={handleSearch} disabled={searching}>
                                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    <span className="ml-2">{searching ? 'Searching…' : 'Search'}</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Roofers in Austin TX"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button variant="primary" onClick={handleSearch} disabled={searching}>
                                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                <span className="ml-2">{searching ? 'Searching…' : 'Search'}</span>
                            </Button>
                        </div>
                    )}

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                </Card>

                {/* Results */}
                {results.length > 0 && (
                    <section className="mb-10">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-medium text-foreground">
                                    {results.length} Results
                                </h3>
                                {sourceLabel && (
                                    <span className="rounded bg-canvas-secondary px-2 py-0.5 text-xs text-foreground-secondary">
                                        via {sourceLabel}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-xs text-foreground-secondary hover:text-foreground"
                                >
                                    {selected.size === results.length ? 'Deselect all' : 'Select all'}
                                </button>
                                {selected.size > 0 && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleImport}
                                        disabled={importing}
                                    >
                                        {importing ? (
                                            <Loader2 size={14} className="animate-spin mr-1" />
                                        ) : (
                                            <ArrowRight size={14} className="mr-1" />
                                        )}
                                        Import {selected.size} selected
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-canvas-secondary">
                                    <tr>
                                        <th className="w-10 px-3 py-2"></th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-foreground-secondary">Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-foreground-secondary">City</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-foreground-secondary">Phone</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-foreground-secondary">Website</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-foreground-secondary">Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {results.map((r) => (
                                        <tr
                                            key={r.place_id}
                                            className={`cursor-pointer transition-colors hover:bg-canvas-secondary/50 ${selected.has(r.place_id) ? 'bg-primary/5' : ''}`}
                                            onClick={() => toggleSelect(r.place_id)}
                                        >
                                            <td className="px-3 py-2.5 text-center">
                                                {selected.has(r.place_id)
                                                    ? <CheckSquare size={16} className="text-primary" />
                                                    : <Square size={16} className="text-foreground-tertiary" />}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <p className="font-medium text-foreground">{r.name}</p>
                                                {r.formatted_address && (
                                                    <p className="text-xs text-foreground-tertiary truncate max-w-xs">{r.formatted_address}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {r.city && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-foreground-secondary">
                                                        <MapPin size={11} />
                                                        {r.city}{r.state ? `, ${r.state}` : ''}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {r.phone ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-foreground-secondary">
                                                        <Phone size={11} />
                                                        {r.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-foreground-tertiary">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {r.website ? (
                                                    <a
                                                        href={r.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                    >
                                                        <Globe size={11} />
                                                        {new URL(r.website).hostname.replace('www.', '')}
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-foreground-tertiary">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {r.rating != null ? (
                                                    <span className="inline-flex items-center gap-1 text-xs">
                                                        <Star size={11} className="text-amber-500" />
                                                        {r.rating}
                                                        {r.review_count != null && (
                                                            <span className="text-foreground-tertiary">({r.review_count})</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-foreground-tertiary">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {selected.size > 0 && (
                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="primary"
                                    onClick={handleImport}
                                    disabled={importing}
                                >
                                    {importing ? (
                                        <Loader2 size={14} className="animate-spin mr-1" />
                                    ) : (
                                        <ArrowRight size={14} className="mr-1" />
                                    )}
                                    Import {selected.size} selected → Prospects
                                </Button>
                            </div>
                        )}
                    </section>
                )}

                {/* Past sessions */}
                <section>
                    <h3 className="mb-3 text-base font-medium text-foreground">Past Searches</h3>
                    {sessionsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <Loader2 size={14} className="animate-spin" /> Loading…
                        </div>
                    ) : sessions.length === 0 ? (
                        <p className="text-sm text-foreground-secondary">No previous searches yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((s) => (
                                <Card key={s.id} variant="default" padding="md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Search size={14} className="text-foreground-secondary" />
                                            <span className="text-sm font-medium text-foreground">{s.query}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-foreground-secondary">
                                            <span>{s.result_count} results</span>
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
            </main>
        </InternalAppShell>
    );
}
