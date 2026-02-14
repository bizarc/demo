import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { buildSystemPrompt, MissionProfile, MISSION_PROFILES } from '@/lib/prompts';
import { MissionProfile as DbMissionProfile } from '@/lib/database.types';
import {
    isValidUuid,
    validateUrl,
    isValidHexColor,
    sanitizeString,
    sanitizeStringArray,
    LIMITS,
} from '@/lib/validation';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';

const VALID_PROFILES = Object.keys(MISSION_PROFILES) as MissionProfile[];

const PROFILE_TO_DB: Record<MissionProfile, DbMissionProfile> = {
    'database-reactivation': 'reactivation',
    'inbound-nurture': 'nurture',
    'customer-service': 'service',
    'review-generation': 'review',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id || !isValidUuid(id)) {
        return NextResponse.json({ error: 'Invalid demo ID' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`demo:${ip}`, DEMO_LIMIT);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Try again later.' },
            { status: 429 }
        );
    }

    try {
        const supabase = createServerClient();

        const { data: demo, error } = await supabase
            .from('demos')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error || !demo) {
            return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
        }

        // Check expiration only for active demos (not drafts)
        if (demo.status === 'active' && demo.expires_at && new Date(demo.expires_at) < new Date()) {
            return NextResponse.json(
                { error: 'This demo has expired', expired: true },
                { status: 410 }
            );
        }

        return NextResponse.json({
            id: demo.id,
            created_at: demo.created_at,
            updated_at: demo.updated_at,
            expires_at: demo.expires_at,
            company_name: demo.company_name,
            industry: demo.industry,
            website_url: demo.website_url,
            products_services: demo.products_services,
            offers: demo.offers,
            qualification_criteria: demo.qualification_criteria,
            logo_url: demo.logo_url,
            primary_color: demo.primary_color,
            secondary_color: demo.secondary_color,
            mission_profile: demo.mission_profile,
            openrouter_model: demo.openrouter_model,
            status: demo.status,
            current_step: demo.current_step,
            system_prompt: demo.system_prompt,
            knowledge_base_id: demo.knowledge_base_id,
        });
    } catch (error) {
        console.error('Demo GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/demo/[id] — Autosave / update a demo.
 * Supports partial updates for draft autosave and full activation.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id || !isValidUuid(id)) {
        return NextResponse.json({ error: 'Invalid demo ID' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`demo:${ip}`, DEMO_LIMIT);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Try again later.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const supabase = createServerClient();

        // Verify demo exists and is not deleted
        const { data: existing, error: fetchError } = await supabase
            .from('demos')
            .select('id, status')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
        }

        const toArray = (val: string | string[] | undefined) =>
            val === undefined ? undefined : sanitizeStringArray(val, LIMITS.productsServicesItems, LIMITS.itemLength);

        // Build update payload (only include fields that are provided)
        const updatePayload: Record<string, unknown> = {};

        if (body.company_name !== undefined) updatePayload.company_name = sanitizeString(body.company_name, LIMITS.companyName) || null;
        if (body.industry !== undefined) updatePayload.industry = sanitizeString(body.industry, LIMITS.industry) || null;
        if (body.website_url !== undefined) {
            const urlResult = validateUrl(body.website_url);
            updatePayload.website_url = urlResult.valid ? urlResult.url : null;
        }
        if (body.products_services !== undefined) updatePayload.products_services = toArray(body.products_services);
        if (body.offers !== undefined) updatePayload.offers = toArray(body.offers);
        if (body.qualification_criteria !== undefined) updatePayload.qualification_criteria = toArray(body.qualification_criteria);
        if (body.logo_url !== undefined) {
            const r = validateUrl(body.logo_url);
            updatePayload.logo_url = r.valid ? r.url : null;
        }
        if (body.primary_color !== undefined) updatePayload.primary_color = (body.primary_color && isValidHexColor(body.primary_color)) ? body.primary_color : null;
        if (body.secondary_color !== undefined) updatePayload.secondary_color = (body.secondary_color && isValidHexColor(body.secondary_color)) ? body.secondary_color : null;
        if (body.openrouter_model !== undefined) updatePayload.openrouter_model = sanitizeString(body.openrouter_model, LIMITS.openrouterModel) || null;
        if (body.current_step !== undefined) updatePayload.current_step = sanitizeString(body.current_step, LIMITS.currentStep) || null;
        if (body.knowledge_base_id !== undefined) {
            updatePayload.knowledge_base_id = body.knowledge_base_id && isValidUuid(body.knowledge_base_id)
                ? body.knowledge_base_id
                : null;
        }

        // Handle mission_profile conversion
        if (body.mission_profile !== undefined) {
            if (body.mission_profile && VALID_PROFILES.includes(body.mission_profile)) {
                updatePayload.mission_profile = PROFILE_TO_DB[body.mission_profile as MissionProfile];
            } else {
                updatePayload.mission_profile = null;
            }
        }

        // --- Activation: transition from draft to active ---
        if (body.status === 'active' && existing.status === 'draft') {
            // Validate required fields for activation
            const companyName = body.company_name ?? (await getField(supabase, id, 'company_name'));
            const missionProfile = body.mission_profile ?? (await getFullMissionProfile(supabase, id));

            if (!companyName || !missionProfile) {
                return NextResponse.json(
                    { error: 'company_name and mission_profile are required to activate' },
                    { status: 400 }
                );
            }

            // Get the full demo data for system prompt generation
            const { data: fullDemo } = await supabase
                .from('demos')
                .select('*')
                .eq('id', id)
                .single();

            if (!fullDemo) {
                return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
            }

            // Merge body updates with existing data
            const mergedCompanyName = body.company_name || fullDemo.company_name;
            const mergedIndustry = body.industry !== undefined ? body.industry : fullDemo.industry;
            const mergedProducts = body.products_services !== undefined
                ? toArray(body.products_services) || []
                : fullDemo.products_services || [];
            const mergedOffers = body.offers !== undefined
                ? toArray(body.offers) || []
                : fullDemo.offers || [];
            const mergedQualCriteria = body.qualification_criteria !== undefined
                ? body.qualification_criteria
                : fullDemo.qualification_criteria?.join(', ');

            // Determine the mission profile for prompt building
            const promptProfile = missionProfile as MissionProfile;

            const system_prompt = buildSystemPrompt(promptProfile, {
                companyName: mergedCompanyName,
                industry: mergedIndustry,
                products: mergedProducts,
                offers: mergedOffers,
                qualificationCriteria: mergedQualCriteria,
            });

            updatePayload.status = 'active';
            updatePayload.system_prompt = system_prompt;
            updatePayload.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            updatePayload.current_step = 'summary';
        }

        // Apply the update
        const { data: updated, error: updateError } = await supabase
            .from('demos')
            .update(updatePayload)
            .eq('id', id)
            .select('id, status, updated_at, expires_at')
            .single();

        if (updateError || !updated) {
            console.error('Supabase update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update demo' },
                { status: 500 }
            );
        }

        const response: Record<string, unknown> = {
            success: true,
            id: updated.id,
            status: updated.status,
            updated_at: updated.updated_at,
        };

        // If just activated, include magic link
        if (body.status === 'active' && updated.status === 'active') {
            response.expires_at = updated.expires_at;
            response.magic_link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demo/${updated.id}`;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Demo PATCH error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/demo/[id] — Soft delete (or hard delete with ?hard=true).
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id || !isValidUuid(id)) {
        return NextResponse.json({ error: 'Invalid demo ID' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`demo:${ip}`, DEMO_LIMIT);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Try again later.' },
            { status: 429 }
        );
    }

    try {
        const supabase = createServerClient();
        const hardDelete = request.nextUrl.searchParams.get('hard') === 'true';

        if (hardDelete) {
            const { error } = await supabase
                .from('demos')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Hard delete error:', error);
                return NextResponse.json({ error: 'Failed to delete demo' }, { status: 500 });
            }
        } else {
            // Soft delete: set deleted_at
            const { error } = await supabase
                .from('demos')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                console.error('Soft delete error:', error);
                return NextResponse.json({ error: 'Failed to delete demo' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Demo DELETE error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Helper: get a single field from the demo row
async function getField(
    supabase: ReturnType<typeof createServerClient>,
    id: string,
    field: string
): Promise<string | null> {
    const { data } = await supabase
        .from('demos')
        .select(field)
        .eq('id', id)
        .single();
    if (!data) return null;
    const record = data as unknown as Record<string, string | null>;
    return record[field] ?? null;
}

// Helper: get the full mission profile (converting DB enum back to full ID)
const DB_TO_PROFILE: Record<string, MissionProfile> = {
    reactivation: 'database-reactivation',
    nurture: 'inbound-nurture',
    service: 'customer-service',
    review: 'review-generation',
};

async function getFullMissionProfile(
    supabase: ReturnType<typeof createServerClient>,
    id: string
): Promise<MissionProfile | null> {
    const { data } = await supabase
        .from('demos')
        .select('mission_profile')
        .eq('id', id)
        .single();
    if (!data?.mission_profile) return null;
    return DB_TO_PROFILE[data.mission_profile] || null;
}
