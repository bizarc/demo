import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, DEMO_LIMIT } from '@/lib/rateLimit';
import { isValidUuid } from '@/lib/validation';
import {
    ingestDocument,
    isSupportedFile,
    MAX_FILE_SIZE_BYTES,
    MAX_FILES_PER_KB,
    MAX_CHUNKS_PER_KB,
} from '@/lib/knowledgeBase';

/**
 * POST /api/knowledge-base/[id]/upload — Upload and ingest a document
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: kbId } = await params;

        if (!kbId || !isValidUuid(kbId)) {
            return NextResponse.json(
                { error: 'Invalid knowledge base ID' },
                { status: 400 }
            );
        }

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`kb-upload:${ip}`, DEMO_LIMIT);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429 }
            );
        }

        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Content-Type must be multipart/form-data' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: 'file is required' },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: `File exceeds ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB limit` },
                { status: 400 }
            );
        }

        if (!isSupportedFile(file.name)) {
            return NextResponse.json(
                { error: 'Supported formats: .txt, .md, .csv, .pdf' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        const { data: kb, error: kbError } = await supabase
            .from('knowledge_bases')
            .select('id')
            .eq('id', kbId)
            .single();

        if (kbError || !kb) {
            return NextResponse.json(
                { error: 'Knowledge base not found' },
                { status: 404 }
            );
        }

        const { count } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('kb_id', kbId);

        if ((count || 0) >= MAX_FILES_PER_KB) {
            return NextResponse.json(
                { error: `Maximum ${MAX_FILES_PER_KB} files per knowledge base` },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const { text, chunks, embeddings } = await ingestDocument(buffer, file.name);

        const { count: existingCount } = await supabase
            .from('chunks')
            .select('*', { count: 'exact', head: true })
            .eq('kb_id', kbId);

        if ((existingCount ?? 0) + chunks.length > MAX_CHUNKS_PER_KB) {
            return NextResponse.json(
                { error: `Would exceed ${MAX_CHUNKS_PER_KB} chunks limit` },
                { status: 400 }
            );
        }

        const { data: doc, error: docError } = await supabase
            .from('documents')
            .insert({
                kb_id: kbId,
                filename: file.name,
                content: text.slice(0, 50000),
                chunk_count: chunks.length,
            })
            .select('id')
            .single();

        if (docError || !doc) {
            console.error('Document insert error:', docError);
            return NextResponse.json(
                { error: 'Failed to save document' },
                { status: 500 }
            );
        }

        const chunkRows = chunks.map((content, i) => ({
            kb_id: kbId,
            document_id: doc.id,
            content,
            embedding: embeddings[i],
            chunk_index: i,
        }));

        const { error: chunksError } = await supabase
            .from('chunks')
            .insert(chunkRows);

        if (chunksError) {
            console.error('Chunks insert error:', chunksError);
            await supabase.from('documents').delete().eq('id', doc.id);
            return NextResponse.json(
                { error: 'Failed to store document chunks' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                id: doc.id,
                filename: file.name,
                chunk_count: chunks.length,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Upload error:', error);
        const message =
            error instanceof Error ? error.message : 'Upload failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
