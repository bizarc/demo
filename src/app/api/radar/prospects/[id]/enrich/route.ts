import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import { enrichProspect } from '@/lib/radar';
import { enrichProspectEmail } from '@/lib/radarEnrich';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * POST /api/radar/prospects/[id]/enrich
 * 1. Email extraction: scrape website → Perplexity → save if found
 * 2. General enrichment: Perplexity research → enrichment_data
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isValidUUID(id)) {
        return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const supabase = createServerClient();

        // Step 1: find email if prospect doesn't have one yet
        try {
            await enrichProspectEmail(supabase, id);
        } catch (emailErr) {
            // Non-fatal — log and continue to general enrichment
            console.warn(`Email enrichment failed for ${id}:`, emailErr);
        }

        // Step 2: general Perplexity enrichment (company info, pain points, etc.)
        await enrichProspect(supabase, id);

        const { data } = await supabase.from('prospects').select('*').eq('id', id).single();

        return NextResponse.json({
            prospect: data,
            email_found: !!data?.email,
        });
    } catch (err) {
        console.error('Prospect enrich error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Enrichment failed' },
            { status: 500 }
        );
    }
}
