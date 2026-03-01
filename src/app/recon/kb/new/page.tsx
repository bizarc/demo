'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewKBPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('custom');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/knowledge-base', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    type,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create KB');
            router.push(`/recon/kb/${data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setSaving(false);
        }
    };

    return (
        <InternalAppShell title="RECON" subtitle="Create Knowledge Base">
            <main className="mx-auto max-w-3xl px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/recon/kb">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft size={14} className="mr-1" /> Back
                            </Button>
                        </Link>
                        <h2 className="text-2xl font-semibold text-foreground">New Knowledge Base</h2>
                    </div>
                    <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
                        <Save size={14} className="mr-1" /> {saving ? 'Creating...' : 'Create'}
                    </Button>
                </div>

                {error && (
                    <div className="mb-6 rounded-md bg-error-bg p-4 text-sm text-error-text">
                        {error}
                    </div>
                )}

                <Card variant="default" padding="lg">
                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Sales Playbook 2024"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What kind of knowledge does this contain?"
                                className="h-24 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="custom">Custom (General Purpose)</option>
                                <option value="product_catalog">Product Catalog</option>
                                <option value="faq">FAQ</option>
                                <option value="service_menu">Service Menu</option>
                                <option value="review_template">Review Template</option>
                            </select>
                        </div>
                    </div>
                </Card>
            </main>
        </InternalAppShell>
    );
}
