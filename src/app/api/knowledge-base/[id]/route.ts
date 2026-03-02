import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';

/**
 * GET /api/knowledge-base/[id] — Get a knowledge base with its documents
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
            .select('id, name, type, description, status, version, created_at, updated_at')
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
            name: kb.name,
            type: kb.type,
            description: kb.description,
            status: kb.status,
            version: kb.version,
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

/**
 * PATCH /api/knowledge-base/[id] — Update a knowledge base (name, description, status)
 * Uses optimistic locking via version field.
 */
export async function PATCH(
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

        const body = await request.json();
        const { name, description, status, version } = body;

        if (version === undefined || typeof version !== 'number') {
            return NextResponse.json(
                { error: 'version is required for optimistic locking' },
                { status: 400 }
            );
        }

        const validStatuses = ['draft', 'reviewed', 'approved', 'archived'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `status must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Build update payload
        const updatePayload: Record<string, unknown> = {
            version: version + 1,
        };
        if (name !== undefined) updatePayload.name = String(name).slice(0, 255);
        if (description !== undefined) updatePayload.description = description ? String(description).slice(0, 1000) : null;
        if (status !== undefined) updatePayload.status = status;

        const { data: kb, error } = await supabase
            .from('knowledge_bases')
            .update(updatePayload)
            .eq('id', id)
            .eq('version', version) // optimistic lock
            .select('id, name, type, description, status, version, updated_at')
            .single();

        if (error || !kb) {
            // Check if it's a version conflict
            const { data: existing } = await supabase
                .from('knowledge_bases')
                .select('id, version')
                .eq('id', id)
                .single();

            if (existing && existing.version !== version) {
                return NextResponse.json(
                    { error: 'Version conflict. The knowledge base was modified by another user.', currentVersion: existing.version },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: 'Knowledge base not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(kb);
    } catch (error) {
        console.error('Knowledge base PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/knowledge-base/[id] — Delete a knowledge base.
 * Documents and chunks are removed via ON DELETE CASCADE.
 * Links in demo_knowledge_bases are removed via ON DELETE CASCADE.
 */
export async function DELETE(
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

        const { error } = await supabase
            .from('knowledge_bases')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Knowledge base DELETE error:', error);
            return NextResponse.json(
                { error: 'Failed to delete knowledge base' },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Knowledge base DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
