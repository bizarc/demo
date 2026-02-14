import { createClient } from '@/lib/supabase/server';

export type ProfileRole = 'super_admin' | 'operator' | 'client_viewer';

/**
 * Get the current authenticated user ID from the session (cookie-based).
 * Returns null when AUTH_DISABLED or when not logged in.
 */
export async function getAuthUserId(): Promise<string | null> {
    if (process.env.AUTH_DISABLED === 'true') return null;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
}

/**
 * Get the user's profile role. Returns 'operator' when AUTH_DISABLED or when profile not found.
 */
export async function getProfileRole(userId: string): Promise<ProfileRole> {
    if (process.env.AUTH_DISABLED === 'true') return 'operator';
    const supabase = await createClient();
    const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
    const role = data?.role as ProfileRole | undefined;
    return role && ['super_admin', 'operator', 'client_viewer'].includes(role)
        ? role
        : 'operator';
}

/**
 * Require auth for protected API routes when AUTH_DISABLED is false.
 * Returns 401 response if auth is required and user is not authenticated.
 * Returns { userId: null } when AUTH_DISABLED (caller uses request body/params).
 */
export async function requireAuth(): Promise<{ userId: string | null } | Response> {
    const userId = await getAuthUserId();
    if (userId) return { userId };
    if (process.env.AUTH_DISABLED === 'true') return { userId: null };
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}
