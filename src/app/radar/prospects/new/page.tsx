'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewProspectPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: '', phone: '', linkedin_url: '', instagram_handle: '',
        first_name: '', last_name: '', company_name: '', title: '',
        industry: '', website_url: '', location: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasContact = !!(form.email?.trim() || form.phone?.trim() || form.linkedin_url?.trim() || form.instagram_handle?.trim() || form.website_url?.trim());
        if (!hasContact) {
            setError('At least one contact identifier is required (email, phone, LinkedIn, Instagram, or website)');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/radar/prospects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Failed to create prospect');
            router.push(`/radar/prospects/${data.prospect.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create prospect');
        } finally {
            setSaving(false);
        }
    };

    return (
        <InternalAppShell title="RADAR — New Prospect" subtitle="Add a prospect manually">
            <main className="mx-auto max-w-2xl px-6 py-10">
                <div className="mb-6">
                    <Link href="/radar/prospects" className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground">
                        <ArrowLeft size={14} /> Back to Prospects
                    </Link>
                </div>

                <h2 className="mb-6 text-2xl font-semibold text-foreground">Add Prospect</h2>

                <Card variant="default" padding="lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">First Name</label>
                                <Input value={form.first_name} onChange={set('first_name')} placeholder="Jane" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Last Name</label>
                                <Input value={form.last_name} onChange={set('last_name')} placeholder="Smith" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                            <Input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">Phone</label>
                            <Input value={form.phone} onChange={set('phone')} placeholder="+1 555 555 5555" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Company</label>
                                <Input value={form.company_name} onChange={set('company_name')} placeholder="Acme Inc." />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
                                <Input value={form.title} onChange={set('title')} placeholder="CEO" />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Industry</label>
                                <Input value={form.industry} onChange={set('industry')} placeholder="SaaS" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Location</label>
                                <Input value={form.location} onChange={set('location')} placeholder="San Francisco, CA" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">Website</label>
                            <Input value={form.website_url} onChange={set('website_url')} placeholder="https://example.com" />
                            <p className="mt-1 text-xs text-foreground-secondary">
                                You can add a prospect with just company name and website; add email later to send campaigns.
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">LinkedIn URL</label>
                            <Input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/..." />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">Instagram Handle</label>
                            <Input value={form.instagram_handle} onChange={set('instagram_handle')} placeholder="@handle" />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Link href="/radar/prospects">
                                <Button variant="ghost" type="button">Cancel</Button>
                            </Link>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? 'Saving…' : 'Add Prospect'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </InternalAppShell>
    );
}
