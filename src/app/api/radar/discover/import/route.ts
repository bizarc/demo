import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import type { PlaceResult } from '@/lib/radarPlaces';

/** POST /api/radar/discover/import — Upsert selected places into prospects */
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const body = await request.json();
        const places: PlaceResult[] = body.places || [];
        const sessionId: string | null = body.session_id || null;

        if (!Array.isArray(places) || places.length === 0) {
            return NextResponse.json({ error: 'No places provided' }, { status: 400 });
        }

        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        let imported = 0;
        let skipped = 0;
        const importedIds: string[] = [];

        for (const place of places) {
            if (!place.name) { skipped++; continue; }

            // Build prospect row — phone satisfies contact constraint if email absent
            const row: Record<string, unknown> = {
                company_name: place.name,
                phone: place.phone || null,
                website_url: place.website || null,
                address: place.formatted_address || null,
                city: place.city || null,
                state: place.state || null,
                google_place_id: place.place_id.startsWith('ai_') ? null : place.place_id,
                google_rating: place.rating ?? null,
                google_review_count: place.review_count ?? null,
                status: 'new',
                imported_by: user?.id || null,
                tags: ['discovery'],
            };

            // Upsert on google_place_id; if AI-generated (no place_id), plain insert
            if (row.google_place_id) {
                const { data, error } = await supabase
                    .from('prospects')
                    .upsert(row, {
                        onConflict: 'google_place_id',
                        ignoreDuplicates: false,
                    })
                    .select('id')
                    .single();

                if (!error && data) {
                    importedIds.push(data.id);
                    imported++;
                } else {
                    skipped++;
                }
            } else {
                // AI-generated result — try to match on company_name to avoid dups
                const { data: existing } = await supabase
                    .from('prospects')
                    .select('id')
                    .ilike('company_name', place.name)
                    .limit(1)
                    .maybeSingle();

                if (existing) {
                    importedIds.push(existing.id);
                    skipped++;
                    continue;
                }

                const { data, error } = await supabase
                    .from('prospects')
                    .insert(row)
                    .select('id')
                    .single();

                if (!error && data) {
                    importedIds.push(data.id);
                    imported++;
                } else {
                    skipped++;
                }
            }
        }

        // Update discovery session imported count
        if (sessionId) {
            await supabase
                .from('discovery_sessions')
                .update({ imported_count: imported })
                .eq('id', sessionId);
        }

        return NextResponse.json({ imported, skipped, ids: importedIds });
    } catch (err) {
        console.error('Discover import error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Import failed' },
            { status: 500 }
        );
    }
}
