import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';

/**
 * POST /api/knowledge-base — Create a new global knowledge base (RECON asset)
 * Can be called from THE LAB inline or from RECON directly.
 */
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`kb:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { name = 'Default', type = 'custom', description } = body;

        const validTypes = [
            'product_catalog',
            'faq',
            'service_menu',
            'review_template',
            'custom',
        ];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `type must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        const { data: kb, error: insertError } = await supabase
            .from('knowledge_bases')
            .insert({
                name: String(name).slice(0, 255),
                type,
                description: description ? String(description).slice(0, 1000) : null,
                status: 'draft',
            })
            .select('id, name, type, description, status, created_at')
            .single();

        if (insertError) {
            console.error('KB create error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create knowledge base' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { id: kb.id, name: kb.name, type: kb.type, description: kb.description, status: kb.status },
            { status: 201 }
        );
    } catch (error) {
        console.error('Knowledge base create error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/knowledge-base — List all knowledge bases (optionally filtered by status)
 */
export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`kb:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const supabase = createServerClient();

        let query = supabase
            .from('knowledge_bases')
            .select('id, name, type, description, status, created_at, updated_at')
            .order('updated_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: kbs, error } = await query;

        if (error) {
            console.error('KB list error:', error);
            return NextResponse.json(
                { error: 'Failed to list knowledge bases' },
                { status: 500 }
            );
        }

        return NextResponse.json({ knowledgeBases: kbs || [] });
    } catch (error) {
        console.error('Knowledge base list error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
