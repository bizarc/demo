import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';

/**
 * GET /api/radar/campaigns — List campaigns
 * Query: status, search, limit, offset
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
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = createServerClient();

        let query = supabase
            .from('campaigns')
            .select(`
                id, name, description, outreach_goal, target_niche, channel, from_name, from_email,
                status, daily_send_limit, created_by, created_at, updated_at, version
            `, { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (search) query = query.ilike('name', `%${search}%`);

        const { data, error, count } = await query;

        if (error) {
            console.error('Campaigns list error:', error);
            return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 });
        }

        return NextResponse.json({ campaigns: data || [], total: count || 0, limit, offset });
    } catch (err) {
        console.error('RADAR campaigns GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/radar/campaigns — Create a campaign
 */
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const body = await request.json();
        const { name, ...rest } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
        }

        // Sanitize optional UUIDs: empty string is invalid for PostgreSQL UUID columns
        const uuidFields = ['research_record_id', 'knowledge_base_id'] as const;
        const sanitized: Record<string, unknown> = { ...rest };
        for (const field of uuidFields) {
            const v = sanitized[field];
            if (v === '' || (typeof v === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))) {
                sanitized[field] = null;
            }
        }

        const supabase = createServerClient();

        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('campaigns')
            .insert({ name: name.trim(), ...sanitized, created_by: user?.id })
            .select()
            .single();

        if (error) {
            console.error('Campaign create error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to create campaign' },
                { status: 500 }
            );
        }

        return NextResponse.json({ campaign: data }, { status: 201 });
    } catch (err) {
        console.error('RADAR campaigns POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
