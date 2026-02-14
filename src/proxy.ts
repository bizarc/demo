import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/session';

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

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Auth: protect AUTH_REQUIRED_PATHS (/, /lab, ...), allow /login, /auth/*, /demo/*
    const authResponse = await updateSession(request);
    if (authResponse.status === 307 || authResponse.status === 308) {
        return authResponse;
    }

    // CORS for API routes (add headers to authResponse to preserve session cookies)
    if (pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin');
        if (origin && isAllowedOrigin(origin)) {
            authResponse.headers.set('Access-Control-Allow-Origin', origin);
        }
        authResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
        authResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        authResponse.headers.set('Access-Control-Max-Age', '86400');

        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 204, headers: authResponse.headers });
        }

        return authResponse;
    }

    return authResponse;
}

export const config = {
    matcher: [
        '/',
        '/api/:path*',
        '/lab/:path*',
        '/lab',
        '/login',
        '/auth/:path*',
        '/demo/:path*',
    ],
};
