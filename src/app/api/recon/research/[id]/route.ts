import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';

/**
 * GET /api/recon/research/[id] — Get a single research record
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id || !isValidUuid(id)) {
            return NextResponse.json(
                { error: 'Invalid research record ID' },
                { status: 400 }
            );
        }

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`recon:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded.' },
                { status: 429 }
            );
        }

        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('research_records')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Research record not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('RECON research GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/recon/research/[id] — Update a research record
 * Uses optimistic locking via version field.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id || !isValidUuid(id)) {
            return NextResponse.json(
                { error: 'Invalid research record ID' },
                { status: 400 }
            );
        }

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`recon:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { version, status, title, summary, offerings, tech_stack, competitors, market_position } = body;

        if (version === undefined || typeof version !== 'number') {
            return NextResponse.json(
                { error: 'version is required for optimistic locking' },
                { status: 400 }
            );
        }

        const validStatuses = ['draft', 'reviewed', 'approved', 'archived'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `status must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        const updatePayload: Record<string, unknown> = {
            version: version + 1,
        };
        if (status !== undefined) updatePayload.status = status;
        if (title !== undefined) updatePayload.title = String(title).slice(0, 500);
        if (summary !== undefined) updatePayload.summary = String(summary).slice(0, 5000);
        if (offerings !== undefined) updatePayload.offerings = offerings;
        if (tech_stack !== undefined) updatePayload.tech_stack = tech_stack;
        if (competitors !== undefined) updatePayload.competitors = competitors;
        if (market_position !== undefined) updatePayload.market_position = market_position;

        const { data, error } = await supabase
            .from('research_records')
            .update(updatePayload)
            .eq('id', id)
            .eq('version', version)
            .select('id, title, summary, status, version, updated_at')
            .single();

        if (error || !data) {
            const { data: existing } = await supabase
                .from('research_records')
                .select('id, version')
                .eq('id', id)
                .single();

            if (existing && existing.version !== version) {
                return NextResponse.json(
                    { error: 'Version conflict. Record was modified by another user.', currentVersion: existing.version },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: 'Research record not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('RECON research PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
