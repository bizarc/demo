import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import { enrichProspect } from '@/lib/radar';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** POST /api/radar/prospects/[id]/enrich — Trigger Perplexity enrichment */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!isValidUUID(id)) {
        return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();
        await enrichProspect(supabase, id);

        const { data } = await supabase.from('prospects').select('*').eq('id', id).single();

        return NextResponse.json({ prospect: data });
    } catch (err) {
        console.error('Prospect enrich error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Enrichment failed' },
            { status: 500 }
        );
    }
}
