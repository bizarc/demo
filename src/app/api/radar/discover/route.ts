import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import {
    searchPlaces,
    enrichPlacesWithDetails,
    searchPlacesAI,
    type PlaceResult,
} from '@/lib/radarPlaces';

/** POST /api/radar/discover — Search Google Places (or AI fallback), save session */
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const body = await request.json();
        const query: string = (body.query || '').trim();
        const niche: string = (body.niche || '').trim();
        const location: string = (body.location || '').trim();

        const finalQuery = query || [niche, location].filter(Boolean).join(' in ');
        if (!finalQuery) {
            return NextResponse.json({ error: 'query or niche + location required' }, { status: 400 });
        }

        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        let results: PlaceResult[] = [];
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;

        if (apiKey) {
            try {
                const raw = await searchPlaces(finalQuery, apiKey);
                results = await enrichPlacesWithDetails(raw, apiKey, 20);
            } catch (err) {
                console.warn('Google Places failed, falling back to AI:', err);
                results = await searchPlacesAI(finalQuery);
            }
        } else {
            results = await searchPlacesAI(finalQuery);
        }

        // Save discovery session
        const { data: session } = await supabase
            .from('discovery_sessions')
            .insert({
                query: finalQuery,
                niche: niche || null,
                location: location || null,
                result_count: results.length,
                raw_results: results,
                created_by: user?.id || null,
            })
            .select('id')
            .single();

        return NextResponse.json({
            session_id: session?.id || null,
            results,
            total: results.length,
            source: apiKey ? 'google_places' : 'ai',
        });
    } catch (err) {
        console.error('Discover error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Discovery failed' },
            { status: 500 }
        );
    }
}
