import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS configuration for API routes.
 * Allows same-origin requests and configured app origins.
 */
const ALLOWED_ORIGINS: string[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    // Allow same-host (e.g. Vercel preview URLs)
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (appUrl) {
            const appHost = new URL(appUrl).hostname;
            const originHost = new URL(origin).hostname;
            if (appHost === originHost) return true;
        }
    } catch {
        // Invalid URL, ignore
    }
    return false;
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Apply CORS only to API routes
    if (pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin');
        const response = NextResponse.next();

        // Only set CORS headers when origin is present and allowed
        if (origin && isAllowedOrigin(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 204, headers: response.headers });
        }

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
