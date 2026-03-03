'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ImportResult {
    imported: number;
    total_rows: number;
    errors: { row: number; message: string }[];
}

export default function ImportProspectsPage() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
        setResult(null);
        setError(null);
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/radar/prospects/import', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Import failed');
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    return (
        <InternalAppShell title="RADAR — Import Prospects" subtitle="Upload a CSV file">
            <main className="mx-auto max-w-2xl px-6 py-10">
                <div className="mb-6">
                    <Link href="/radar/prospects" className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground">
                        <ArrowLeft size={14} /> Back to Prospects
                    </Link>
                </div>

                <h2 className="mb-6 text-2xl font-semibold text-foreground">Import Prospects</h2>

                <Card variant="default" padding="lg" className="mb-4">
                    <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-foreground">Expected CSV columns:</p>
                        <code className="block rounded bg-canvas-secondary px-3 py-2 text-xs text-foreground-secondary">
                            email, first_name, last_name, company_name, title, phone, linkedin_url, instagram_handle, industry, location, tags
                        </code>
                        <p className="mt-2 text-xs text-foreground-secondary">
                            At least one of: email, phone, linkedin_url, or instagram_handle required per row. Max 5,000 rows.
                        </p>
                    </div>

                    <div
                        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-canvas-secondary"
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload size={24} className="text-foreground-secondary" />
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                {file ? file.name : 'Click to upload CSV'}
                            </p>
                            {file && (
                                <p className="text-xs text-foreground-secondary">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {error && (
                        <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {!result && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="primary"
                                onClick={handleImport}
                                disabled={!file || importing}
                            >
                                {importing ? 'Importing…' : 'Import Prospects'}
                            </Button>
                        </div>
                    )}
                </Card>

                {result && (
                    <Card variant="default" padding="lg">
                        <div className="mb-4 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-green-600" />
                            <h3 className="text-base font-medium text-foreground">Import Complete</h3>
                        </div>
                        <p className="mb-4 text-sm text-foreground-secondary">
                            <strong className="text-foreground">{result.imported}</strong> prospects imported out of{' '}
                            <strong className="text-foreground">{result.total_rows}</strong> rows.
                        </p>

                        {result.errors.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-foreground">
                                    {result.errors.length} rows skipped:
                                </p>
                                <div className="max-h-48 overflow-y-auto rounded border border-border">
                                    <table className="w-full text-xs">
                                        <thead className="bg-canvas-secondary">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-foreground-secondary">Row</th>
                                                <th className="px-3 py-2 text-left text-foreground-secondary">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.errors.map((e, i) => (
                                                <tr key={i} className="border-t border-border">
                                                    <td className="px-3 py-2 text-foreground">{e.row}</td>
                                                    <td className="px-3 py-2 text-foreground-secondary">{e.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex gap-2">
                            <Link href="/radar/prospects">
                                <Button variant="primary" size="sm">View Prospects</Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => { setResult(null); setFile(null); }}>
                                Import Another
                            </Button>
                        </div>
                    </Card>
                )}
            </main>
        </InternalAppShell>
    );
}
