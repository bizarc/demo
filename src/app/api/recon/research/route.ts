import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';

/**
 * GET /api/recon/research — List research records with optional filters
 * Query params: status, search, limit, offset
 */
export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`recon:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = createServerClient();

        let query = supabase
            .from('research_records')
            .select('id, title, summary, status, version, source, competitors, offerings, tech_stack, confidence_score, created_by, created_at, updated_at', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Research list error:', error);
            return NextResponse.json(
                { error: 'Failed to list research records' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            records: data || [],
            total: count || 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error('RECON research list error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
