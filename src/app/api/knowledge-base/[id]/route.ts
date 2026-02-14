import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';

/**
 * GET /api/knowledge-base/[id] — List documents in a knowledge base
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id || !isValidUuid(id)) {
            return NextResponse.json(
                { error: 'Invalid knowledge base ID' },
                { status: 400 }
            );
        }

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`kb:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const supabase = createServerClient();

        const { data: kb, error: kbError } = await supabase
            .from('knowledge_bases')
            .select('id, demo_id, name, type')
            .eq('id', id)
            .single();

        if (kbError || !kb) {
            return NextResponse.json(
                { error: 'Knowledge base not found' },
                { status: 404 }
            );
        }

        const { data: documents, error: docsError } = await supabase
            .from('documents')
            .select('id, filename, chunk_count, created_at')
            .eq('kb_id', id)
            .order('created_at', { ascending: false });

        if (docsError) {
            console.error('Documents fetch error:', docsError);
            return NextResponse.json(
                { error: 'Failed to list documents' },
                { status: 500 }
            );
        }

        const totalChunks = (documents || []).reduce(
            (sum, d) => sum + (d.chunk_count || 0),
            0
        );

        return NextResponse.json({
            id: kb.id,
            demo_id: kb.demo_id,
            name: kb.name,
            type: kb.type,
            documents: documents || [],
            totalChunks,
        });
    } catch (error) {
        console.error('Knowledge base GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
