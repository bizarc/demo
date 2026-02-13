'use client';

import { useState } from 'react';
import { ScrapeResult } from '@/lib/scraper';
import { useToast } from '@/components/ui/Toast';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';

interface WebsiteStepProps {
    url: string;
    scrapeResult: ScrapeResult | null;
    onUrlChange: (url: string) => void;
    onScrapeComplete: (result: ScrapeResult) => void;
    onNext: () => void;
    onBack: () => void;
}

const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms',
};

export function WebsiteStep({
    url,
    scrapeResult,
    onUrlChange,
    onScrapeComplete,
    onNext,
    onBack,
}: WebsiteStepProps) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleScrape = async () => {
        if (!url.trim()) { setError('Please enter a URL'); return; }
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithRetry('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to scrape website');
            onScrapeComplete(data.data);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to scrape website';
            setError(msg);
            addToast({ title: 'Scrape failed', description: msg, variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const isValidUrl = (urlString: string) => {
        try { new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`); return true; }
        catch { return false; }
    };

    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Enter target website
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                We&apos;ll analyze the website to extract company information
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        Website URL
                    </label>
                    <input
                        type="text"
                        placeholder="example.com"
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                            borderRadius: '6px',
                            outline: 'none',
                            color: 'var(--color-text-primary)',
                            boxSizing: 'border-box',
                        }}
                    />
                    {error && (
                        <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>{error}</p>
                    )}
                </div>
                <div style={{ paddingTop: '26px' }}>
                    <Button onClick={handleScrape} disabled={!url.trim() || !isValidUrl(url)} loading={loading}>
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                </div>
            </div>

            {loading && (
                <div style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '32px',
                    textAlign: 'center',
                    marginBottom: '24px',
                }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        Analyzing website...
                    </div>
                </div>
            )}

            {scrapeResult && !loading && (
                <div style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '24px',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                        Extracted information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                        <div style={{ display: 'flex' }}>
                            <span style={{ color: 'var(--color-text-secondary)', width: '120px', flexShrink: 0 }}>Company:</span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{scrapeResult.companyName}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ color: 'var(--color-text-secondary)', width: '120px', flexShrink: 0 }}>Industry:</span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{scrapeResult.industry || 'Not detected'}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ color: 'var(--color-text-secondary)', width: '120px', flexShrink: 0 }}>Description:</span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{scrapeResult.description || 'Not available'}</span>
                        </div>
                        {scrapeResult.logoUrl && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-secondary)', width: '120px', flexShrink: 0 }}>Logo:</span>
                                <OptimizedImage src={scrapeResult.logoUrl} alt="Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '16px' }}>
                        You can edit these details in the next step
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ ...btnBase, background: 'transparent', color: 'var(--color-text-secondary)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!scrapeResult}
                    style={{
                        ...btnBase,
                        background: 'var(--color-primary)',
                        color: '#FFFFFF',
                        opacity: scrapeResult ? 1 : 0.5,
                        cursor: scrapeResult ? 'pointer' : 'not-allowed',
                    }}
                >
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
}
