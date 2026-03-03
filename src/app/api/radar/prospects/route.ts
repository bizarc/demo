import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit } from '@/lib/rateLimit';
import { RADAR_LIMIT } from '@/lib/rateLimit';

/**
 * GET /api/radar/prospects — List prospects
 * Query: status, search, tag, limit, offset
 */
export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const tag = searchParams.get('tag');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = createServerClient();

        let query = supabase
            .from('prospects')
            .select('id, email, first_name, last_name, company_name, title, industry, score, status, tags, enriched_at, created_at, updated_at, city, state, phone', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (search) {
            query = query.or(
                `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`
            );
        }
        if (tag) query = query.contains('tags', [tag]);

        const { data, error, count } = await query;

        if (error) {
            console.error('Prospects list error:', error);
            return NextResponse.json({ error: 'Failed to list prospects' }, { status: 500 });
        }

        return NextResponse.json({ prospects: data || [], total: count || 0, limit, offset });
    } catch (err) {
        console.error('RADAR prospects GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/radar/prospects — Create a single prospect
 */
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const body = await request.json();
        const { email, phone, linkedin_url, instagram_handle, ...rest } = body;

        if (!email && !phone && !linkedin_url && !instagram_handle) {
            return NextResponse.json(
                { error: 'At least one contact identifier required (email, phone, linkedin_url, or instagram_handle)' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('prospects')
            .insert({
                email: email?.toLowerCase() || undefined,
                phone,
                linkedin_url,
                instagram_handle,
                ...rest,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'A prospect with this email already exists' }, { status: 409 });
            }
            console.error('Prospect create error:', error);
            return NextResponse.json({ error: 'Failed to create prospect' }, { status: 500 });
        }

        return NextResponse.json({ prospect: data }, { status: 201 });
    } catch (err) {
        console.error('RADAR prospects POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
