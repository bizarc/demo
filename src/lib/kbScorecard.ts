/**
 * Knowledge Base quality scorecard — metrics and promotion recommendation.
 */

import { createServerClient } from '@/lib/supabase';
import { MAX_FILES_PER_KB, MAX_CHUNKS_PER_KB } from './knowledgeBase';

export interface KbScorecard {
    kb_id: string;
    name: string;
    type: string;
    status: string;
    document_count: number;
    total_chunks: number;
    max_documents: number;
    max_chunks: number;
    coverage_documents_pct: number;
    coverage_chunks_pct: number;
    recommendation: 'draft' | 'reviewed' | 'approved';
    recommendation_reason: string;
    checks: { id: string; label: string; passed: boolean; detail?: string }[];
}

export async function getKbScorecard(kbId: string): Promise<KbScorecard | null> {
    const supabase = createServerClient();

    const { data: kb, error: kbError } = await supabase
        .from('knowledge_bases')
        .select('id, name, type, status')
        .eq('id', kbId)
        .single();

    if (kbError || !kb) return null;

    const { data: documents } = await supabase
        .from('documents')
        .select('id, chunk_count')
        .eq('kb_id', kbId);

    const docList = documents ?? [];
    const documentCount = docList.length;
    const totalChunks = docList.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

    const coverageDocPct = Math.min(100, Math.round((documentCount / MAX_FILES_PER_KB) * 100));
    const coverageChunkPct = Math.min(100, Math.round((totalChunks / MAX_CHUNKS_PER_KB) * 100));

    const checks: KbScorecard['checks'] = [
        {
            id: 'has_documents',
            label: 'Has at least one document',
            passed: documentCount > 0,
            detail: documentCount > 0 ? `${documentCount} document(s)` : 'Upload documents to improve retrieval.',
        },
        {
            id: 'has_chunks',
            label: 'Has embedded chunks',
            passed: totalChunks > 0,
            detail: totalChunks > 0 ? `${totalChunks} chunk(s)` : 'Chunks are created on upload.',
        },
        {
            id: 'under_cap',
            label: 'Within capacity limits',
            passed: documentCount <= MAX_FILES_PER_KB && totalChunks <= MAX_CHUNKS_PER_KB,
            detail: `${documentCount}/${MAX_FILES_PER_KB} files, ${totalChunks}/${MAX_CHUNKS_PER_KB} chunks`,
        },
    ];

    let recommendation: KbScorecard['recommendation'] = 'draft';
    let recommendationReason = '';

    if (documentCount === 0 || totalChunks === 0) {
        recommendation = 'draft';
        recommendationReason = 'Add and ingest documents before promoting.';
    } else if (kb.status === 'approved') {
        recommendation = 'approved';
        recommendationReason = 'KB is already approved for production.';
    } else if (kb.status === 'reviewed') {
        recommendation = 'approved';
        recommendationReason = 'KB is reviewed; ready for approval if governance passes.';
    } else {
        recommendation = documentCount >= 1 && totalChunks >= 5 ? 'reviewed' : 'draft';
        recommendationReason =
            documentCount >= 1 && totalChunks >= 5
                ? 'Has content; move to Reviewed after operator review.'
                : 'Add more content or complete ingestion, then review.';
    }

    return {
        kb_id: kb.id,
        name: kb.name,
        type: kb.type,
        status: kb.status,
        document_count: documentCount,
        total_chunks: totalChunks,
        max_documents: MAX_FILES_PER_KB,
        max_chunks: MAX_CHUNKS_PER_KB,
        coverage_documents_pct: coverageDocPct,
        coverage_chunks_pct: coverageChunkPct,
        recommendation,
        recommendation_reason: recommendationReason,
        checks,
    };
}
