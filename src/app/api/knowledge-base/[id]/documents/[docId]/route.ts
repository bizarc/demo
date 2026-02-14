import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';

/**
 * DELETE /api/knowledge-base/[id]/documents/[docId] — Remove a document and its chunks
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    try {
        const { id: kbId, docId } = await params;

        if (!kbId || !isValidUuid(kbId) || !docId || !isValidUuid(docId)) {
            return NextResponse.json(
                { error: 'Invalid knowledge base or document ID' },
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

        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('id, kb_id')
            .eq('id', docId)
            .eq('kb_id', kbId)
            .single();

        if (fetchError || !doc) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        await supabase.from('chunks').delete().eq('document_id', docId);
        await supabase.from('documents').delete().eq('id', docId);

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('Document DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
