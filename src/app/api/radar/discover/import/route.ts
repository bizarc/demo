import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import type { PlaceResult } from '@/lib/radarPlaces';

/** POST /api/radar/discover/import — Import selected places into prospects
 *
 * Works against two schema states:
 *  - Original (migration 001): status ∈ {active,unsubscribed,bounced,archived},
 *    contact constraint = email|phone|linkedin|instagram
 *  - After migration 007: adds google_place_id, city, state, address, google_rating,
 *    google_review_count; status 'new'; contact constraint + website_url|google_place_id
 *
 * Strategy: try the full row first. If the DB rejects it (columns missing or
 * constraint violation), fall back to a minimal row using only original-schema
 * columns so prospects land in the DB regardless of migration state.
 */
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
        const firstError: string[] = []; // collect first insert error for debugging

        for (const place of places) {
            if (!place.name) { skipped++; continue; }

            const isAiResult = place.place_id.startsWith('ai_');
            const googlePlaceId = isAiResult ? null : place.place_id;
            const phone = place.phone || null;
            const websiteUrl = place.website || null;

            // ── Dedup: always by company_name (safe without migration 007 columns) ──
            // Secondary check on google_place_id only when the column likely exists
            // (i.e. we have a google place id). If the column is absent from DB the
            // query silently fails (data = null) and we fall through to insert.
            if (googlePlaceId) {
                const { data: byPlaceId } = await supabase
                    .from('prospects')
                    .select('id')
                    .eq('google_place_id', googlePlaceId)
                    .maybeSingle();
                if (byPlaceId) { importedIds.push(byPlaceId.id); skipped++; continue; }
            }

            const { data: byName } = await supabase
                .from('prospects')
                .select('id')
                .ilike('company_name', place.name)
                .limit(1)
                .maybeSingle();
            if (byName) { importedIds.push(byName.id); skipped++; continue; }

            // ── Build full row (requires migration 007) ──────────────────────────
            const fullRow: Record<string, unknown> = {
                company_name: place.name,
                phone,
                website_url: websiteUrl,
                address: place.formatted_address || null,
                city: place.city || null,
                state: place.state || null,
                google_place_id: googlePlaceId,
                google_rating: place.rating ?? null,
                google_review_count: place.review_count ?? null,
                status: 'new',
                imported_by: user?.id || null,
                tags: ['discovery'],
            };

            const { data, error: fullErr } = await supabase
                .from('prospects')
                .insert(fullRow)
                .select('id')
                .single();

            if (data) {
                importedIds.push(data.id);
                imported++;
                continue;
            }

            // ── Full insert failed — fall back to original-schema row ────────────
            // Original prospect_has_contact: email|phone|linkedin|instagram only.
            // 'website_url' and 'google_place_id' do NOT satisfy original constraint.
            // So we must have phone to proceed; skip otherwise.
            if (!phone) {
                if (firstError.length === 0 && fullErr) firstError.push(fullErr.message);
                skipped++;
                continue;
            }

            const minimalRow: Record<string, unknown> = {
                company_name: place.name,
                phone,
                website_url: websiteUrl,
                status: 'active',   // 'new' requires migration 007
                imported_by: user?.id || null,
                tags: ['discovery'],
            };

            const { data: d2, error: minErr } = await supabase
                .from('prospects')
                .insert(minimalRow)
                .select('id')
                .single();

            if (d2) {
                importedIds.push(d2.id);
                imported++;
            } else {
                const msg = minErr?.message || fullErr?.message || 'unknown';
                console.error('Prospect insert error (both attempts):', msg, { place_name: place.name });
                if (firstError.length === 0) firstError.push(msg);
                skipped++;
            }
        }

        // ── Increment session imported count (only if discovery_sessions exists) ─
        if (sessionId && imported > 0) {
            const { data: session, error: sessionErr } = await supabase
                .from('discovery_sessions')
                .select('imported_count')
                .eq('id', sessionId)
                .single();

            if (!sessionErr && session) {
                const prev = session.imported_count ?? 0;
                await supabase
                    .from('discovery_sessions')
                    .update({ imported_count: prev + imported })
                    .eq('id', sessionId);
            }
            // If discovery_sessions table doesn't exist yet (pre-migration-007), skip silently
        }

        return NextResponse.json({
            imported,
            skipped,
            ids: importedIds,
            // Surface the first DB error so the caller can show it to the user
            ...(imported === 0 && firstError.length > 0 && { db_error: firstError[0] }),
        });
    } catch (err) {
        console.error('Discover import error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Import failed' },
            { status: 500 }
        );
    }
}
