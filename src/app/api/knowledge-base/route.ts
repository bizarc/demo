import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';

/**
 * POST /api/knowledge-base — Create a new knowledge base for a demo
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
        const { demoId, name = 'Default', type = 'custom' } = body;

        if (!demoId || !isValidUuid(demoId)) {
            return NextResponse.json(
                { error: 'demoId is required and must be a valid UUID' },
                { status: 400 }
            );
        }

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

        const { data: demo, error: demoError } = await supabase
            .from('demos')
            .select('id')
            .eq('id', demoId)
            .is('deleted_at', null)
            .single();

        if (demoError || !demo) {
            return NextResponse.json(
                { error: 'Demo not found' },
                { status: 404 }
            );
        }

        const { data: kb, error: insertError } = await supabase
            .from('knowledge_bases')
            .insert({
                demo_id: demoId,
                name: String(name).slice(0, 255),
                type,
            })
            .select('id, demo_id, name, type, created_at')
            .single();

        if (insertError) {
            console.error('KB create error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create knowledge base' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { id: kb.id, demo_id: kb.demo_id, name: kb.name, type: kb.type },
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
