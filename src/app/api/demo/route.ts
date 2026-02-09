import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt, MissionProfile } from '@/lib/prompts';

// Generate a simple unique ID
function generateId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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

        // Build system prompt
        const system_prompt = buildSystemPrompt(mission_profile as MissionProfile, {
            companyName: company_name,
            industry,
            products: products_services?.split(',').map((s: string) => s.trim()),
            offers: offers?.split(',').map((s: string) => s.trim()),
            qualificationCriteria: qualification_criteria,
        });

        // Generate ID and expiration
        const id = generateId();
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        // Create Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Insert into database
        const { error: insertError } = await supabase
            .from('demos')
            .insert({
                id,
                company_name,
                industry,
                website_url,
                products_services,
                offers,
                qualification_criteria,
                logo_url,
                primary_color: primary_color || '#2563EB',
                secondary_color: secondary_color || '#FFFFFF',
                mission_profile,
                openrouter_model: openrouter_model || 'openai/gpt-4o-mini',
                system_prompt,
                expires_at,
            });

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create demo' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            id,
            expires_at,
            magic_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demo/${id}`,
        });
    } catch (error) {
        console.error('Demo API error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: demo, error } = await supabase
        .from('demos')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !demo) {
        return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Check expiration
    if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Demo has expired' }, { status: 410 });
    }

    // Return demo without sensitive data
    return NextResponse.json({
        id: demo.id,
        company_name: demo.company_name,
        industry: demo.industry,
        website_url: demo.website_url,
        logo_url: demo.logo_url,
        primary_color: demo.primary_color,
        secondary_color: demo.secondary_color,
        mission_profile: demo.mission_profile,
        expires_at: demo.expires_at,
    });
}
