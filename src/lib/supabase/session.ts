import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Paths that require authentication. Add new internal ops routes as they are built.
 * Public routes: /login, /auth/*, /demo/* (magic link chat)
 */
const AUTH_REQUIRED_PATHS = [
    '/',      // Home / Command Deck
    '/lab',   // Demo builder
    // Future: '/radar', '/blueprint', '/mission-control', '/portal'
];

function isAuthRequiredPath(pathname: string): boolean {
    if (pathname === '/') return true;
    return AUTH_REQUIRED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthPath(pathname: string): boolean {
    return pathname === '/login' || pathname.startsWith('/auth/');
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data } = await supabase.auth.getClaims();
    const hasValidSession = !!data?.claims;

    if (process.env.AUTH_DISABLED === 'true') {
        return supabaseResponse;
    }

    if (!hasValidSession && isAuthRequiredPath(request.nextUrl.pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    if (hasValidSession && isAuthPath(request.nextUrl.pathname)) {
        const redirect = request.nextUrl.searchParams.get('redirect') || '/';
        return NextResponse.redirect(new URL(redirect, request.url));
    }

    return supabaseResponse;
}
