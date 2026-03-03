import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import { enrollProspects } from '@/lib/radar';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** GET /api/radar/campaigns/[id]/enrollments */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('campaign_enrollments')
            .select(`
                id, status, current_step, enrolled_at, next_send_at, completed_at,
                prospects (id, email, first_name, last_name, company_name)
            `, { count: 'exact' })
            .eq('campaign_id', id)
            .order('enrolled_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);

        const { data, error, count } = await query;
        if (error) return NextResponse.json({ error: 'Failed to load enrollments' }, { status: 500 });

        return NextResponse.json({ enrollments: data || [], total: count || 0, limit, offset });
    } catch (err) {
        console.error('Enrollments GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** POST /api/radar/campaigns/[id]/enrollments — Enroll prospects */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const body = await request.json();
        const { prospect_ids } = body;

        if (!Array.isArray(prospect_ids) || prospect_ids.length === 0) {
            return NextResponse.json({ error: 'prospect_ids array required' }, { status: 400 });
        }

        if (prospect_ids.some((pid: string) => !isValidUUID(pid))) {
            return NextResponse.json({ error: 'Invalid prospect ID in list' }, { status: 400 });
        }

        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        const result = await enrollProspects(supabase, id, prospect_ids, user?.id || '');
        return NextResponse.json(result, { status: 201 });
    } catch (err) {
        console.error('Enrollments POST error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to enroll prospects' },
            { status: 500 }
        );
    }
}
