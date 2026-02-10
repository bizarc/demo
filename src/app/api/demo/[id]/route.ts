import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Demo ID is required' }, { status: 400 });
    }

    try {
        const supabase = createServerClient();

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
            return NextResponse.json(
                { error: 'This demo has expired', expired: true },
                { status: 410 }
            );
        }

        // Return demo config — exclude sensitive fields
        return NextResponse.json({
            id: demo.id,
            created_at: demo.created_at,
            expires_at: demo.expires_at,
            company_name: demo.company_name,
            industry: demo.industry,
            website_url: demo.website_url,
            products_services: demo.products_services,
            offers: demo.offers,
            logo_url: demo.logo_url,
            primary_color: demo.primary_color,
            secondary_color: demo.secondary_color,
            mission_profile: demo.mission_profile,
        });
    } catch (error) {
        console.error('Demo GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
