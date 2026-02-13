'use client';

import { useReportWebVitals } from 'next/web-vitals';

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

function handleWebVitals(metric: Metric) {
    if (process.env.NODE_ENV === 'development') {
        const label = `${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'}`;
        const style = metric.rating === 'good' ? 'color: #0F9D58' : metric.rating === 'needs-improvement' ? 'color: #F59E0B' : 'color: #EF4444';
        console.log(`%c[Web Vitals] ${label} (${metric.rating})`, style);
    }
    // Production: send to analytics via navigator.sendBeacon or fetch
    // Example: if (typeof window !== 'undefined' && window.gtag) { ... }
}

export function WebVitals() {
    useReportWebVitals(handleWebVitals);
    return null;
}
