import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { buildSystemPrompt, MissionProfile, MISSION_PROFILES } from '@/lib/prompts';

import { MissionProfile as DbMissionProfile } from '@/lib/database.types';

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
        const body = await request.json();

        const {
            mission_profile,
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
        } = body;

        // Validate required fields
        if (!mission_profile || !company_name) {
            return NextResponse.json(
                { error: 'mission_profile and company_name are required' },
                { status: 400 }
            );
        }

        // Validate mission profile enum
        if (!VALID_PROFILES.includes(mission_profile)) {
            return NextResponse.json(
                { error: `Invalid mission_profile. Must be one of: ${VALID_PROFILES.join(', ')}` },
                { status: 400 }
            );
        }

        // Convert comma-separated strings to arrays for DB
        const toArray = (val: string | string[] | undefined): string[] => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            return val.split(',').map((s: string) => s.trim()).filter(Boolean);
        };

        // Build system prompt
        const system_prompt = buildSystemPrompt(mission_profile as MissionProfile, {
            companyName: company_name,
            industry,
            products: toArray(products_services),
            offers: toArray(offers),
            qualificationCriteria: qualification_criteria,
        });

        // Set expiration (7 days)
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const supabase = createServerClient();

        // Let Supabase generate the UUID — don't pass id
        const { data, error: insertError } = await supabase
            .from('demos')
            .insert({
                company_name,
                industry: industry || null,
                website_url: website_url || '',
                products_services: toArray(products_services),
                offers: toArray(offers),
                qualification_criteria: toArray(qualification_criteria),
                logo_url: logo_url || null,
                primary_color: primary_color || '#2563EB',
                secondary_color: secondary_color || '#FFFFFF',
                mission_profile: PROFILE_TO_DB[mission_profile as MissionProfile],
                openrouter_model: openrouter_model || 'openai/gpt-4o-mini',
                system_prompt,
                expires_at,
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
