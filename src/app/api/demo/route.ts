import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAuth, getProfileRole } from '@/lib/auth';
import { buildSystemPrompt, MissionProfile, MISSION_PROFILES, Channel } from '@/lib/prompts';

import { MissionProfile as DbMissionProfile } from '@/lib/database.types';
import {
    validateUrl,
    isValidHexColor,
    sanitizeString,
    sanitizeStringArray,
    LIMITS,
} from '@/lib/validation';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';

const VALID_PROFILES = Object.keys(MISSION_PROFILES) as MissionProfile[];

// Map full profile IDs to the short DB enum values
const PROFILE_TO_DB: Record<MissionProfile, DbMissionProfile> = {
    'database-reactivation': 'reactivation',
    'inbound-nurture': 'nurture',
    'customer-service': 'service',
    'review-generation': 'review',
};

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof Response) return authResult;
        const { userId } = authResult;

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`demo:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const VALID_CHANNELS = ['sms', 'messenger', 'email', 'website', 'voice'] as const;
        const {
            status = 'active', // 'draft' or 'active'
            mission_profile,
            channel: bodyChannel,
            company_name,
            industry,
            website_url,
            products_services,
            offers,
            qualification_criteria,
            logo_url,
            primary_color,
            secondary_color,
            openrouter_model,
            current_step,
            created_by: bodyCreatedBy,
        } = body;
        const channel = bodyChannel && VALID_CHANNELS.includes(bodyChannel) ? bodyChannel : 'website';

        const created_by = userId !== null ? userId : (sanitizeString(bodyCreatedBy, LIMITS.creatorId) || null);

        const toArray = (val: string | string[] | undefined, maxItems = LIMITS.productsServicesItems): string[] => {
            return sanitizeStringArray(val, maxItems, LIMITS.itemLength);
        };

        const supabase = createServerClient();

        // --- Draft mode: partial save, minimal validation ---
        if (status === 'draft') {
            const dbMissionProfile = mission_profile && VALID_PROFILES.includes(mission_profile)
                ? PROFILE_TO_DB[mission_profile as MissionProfile]
                : null;

            // Validate website_url if provided
            let safeWebsiteUrl: string | null = null;
            if (website_url) {
                const urlResult = validateUrl(website_url);
                if (!urlResult.valid) {
                    return NextResponse.json({ error: urlResult.error }, { status: 400 });
                }
                safeWebsiteUrl = urlResult.url;
            }

            const { data, error: insertError } = await supabase
                .from('demos')
                .insert({
                    status: 'draft',
                    company_name: sanitizeString(company_name, LIMITS.companyName) || null,
                    industry: sanitizeString(industry, LIMITS.industry) || null,
                    website_url: safeWebsiteUrl,
                    products_services: toArray(products_services),
                    offers: toArray(offers),
                    qualification_criteria: toArray(qualification_criteria),
                    logo_url: (() => {
                        if (!logo_url) return null;
                        const r = validateUrl(logo_url);
                        return r.valid ? r.url : null;
                    })(),
                    primary_color: (primary_color && isValidHexColor(primary_color)) ? primary_color : '#2563EB',
                    secondary_color: (secondary_color && isValidHexColor(secondary_color)) ? secondary_color : '#FFFFFF',
                    mission_profile: dbMissionProfile,
                    channel: channel as Channel,
                    openrouter_model: sanitizeString(openrouter_model, LIMITS.openrouterModel) || null,
                    system_prompt: null,
                    expires_at: null,
                    current_step: sanitizeString(current_step, LIMITS.currentStep) || 'mission',
                    created_by: sanitizeString(created_by, LIMITS.creatorId) || null,
                })
                .select('id')
                .single();

            if (insertError || !data) {
                console.error('Supabase draft insert error:', insertError);
                return NextResponse.json(
                    { error: 'Failed to create draft' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                id: data.id,
                status: 'draft',
            });
        }

        // --- Active mode: full validation + system prompt generation ---
        if (!mission_profile || !company_name) {
            return NextResponse.json(
                { error: 'mission_profile and company_name are required' },
                { status: 400 }
            );
        }

        if (!VALID_PROFILES.includes(mission_profile)) {
            return NextResponse.json(
                { error: `Invalid mission_profile. Must be one of: ${VALID_PROFILES.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate website_url for active demos
        const websiteUrlResult = validateUrl(website_url);
        const safeWebsiteUrl = websiteUrlResult.valid ? websiteUrlResult.url : '';

        // Build system prompt (channel-aware)
        const system_prompt = buildSystemPrompt(
            mission_profile as MissionProfile,
            {
                companyName: company_name,
                industry,
                products: toArray(products_services),
                offers: toArray(offers),
                qualificationCriteria: qualification_criteria,
            },
            channel as Channel
        );

        // Set expiration (7 days)
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error: insertError } = await supabase
            .from('demos')
            .insert({
                company_name: sanitizeString(company_name, LIMITS.companyName),
                industry: sanitizeString(industry, LIMITS.industry) || null,
                website_url: safeWebsiteUrl,
                products_services: toArray(products_services),
                offers: toArray(offers),
                qualification_criteria: toArray(qualification_criteria, LIMITS.qualificationItems),
                logo_url: (() => {
                    if (!logo_url) return null;
                    const r = validateUrl(logo_url);
                    return r.valid ? r.url : null;
                })(),
                primary_color: (primary_color && isValidHexColor(primary_color)) ? primary_color : '#2563EB',
                secondary_color: (secondary_color && isValidHexColor(secondary_color)) ? secondary_color : '#FFFFFF',
                mission_profile: PROFILE_TO_DB[mission_profile as MissionProfile],
                channel: channel as Channel,
                openrouter_model: sanitizeString(openrouter_model, LIMITS.openrouterModel) || 'openai/gpt-4o-mini',
                system_prompt,
                expires_at,
                status: 'active',
                created_by: sanitizeString(created_by, LIMITS.creatorId) || null,
                current_step: 'summary',
            })
            .select('id')
            .single();

        if (insertError || !data) {
            console.error('Supabase insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create demo' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            expires_at,
            magic_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demo/${data.id}`,
        });
    } catch (error) {
        console.error('Demo API error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * GET /api/demo — List demos for a user (filtered by created_by).
 * When auth enabled: uses session user. When AUTH_DISABLED: requires created_by query param.
 * Query params: created_by (required when AUTH_DISABLED), status (optional filter)
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof Response) return authResult;
        const { userId } = authResult;

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`demo:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const { searchParams } = request.nextUrl;
        const createdByParam = sanitizeString(searchParams.get('created_by'), LIMITS.creatorId);
        const createdBy = userId ?? createdByParam;

        if (!createdBy) {
            return NextResponse.json(
                { error: 'created_by is required when auth is disabled' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();
        const role = userId ? await getProfileRole(userId) : 'operator';

        let query = supabase
            .from('demos')
            .select('id, company_name, industry, website_url, mission_profile, status, current_step, created_at, updated_at, expires_at, logo_url, primary_color, openrouter_model')
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });

        if (role !== 'super_admin') {
            query = query.eq('created_by', createdBy);
        }

        const statusFilter = searchParams.get('status') as 'draft' | 'active' | 'expired' | 'blueprint' | null;
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Demo list error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch demos' },
                { status: 500 }
            );
        }

        return NextResponse.json({ demos: data || [] });
    } catch (error) {
        console.error('Demo GET error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
