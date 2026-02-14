/**
 * RAG retrieval: embed query, search chunks, format context
 */

import { embedText } from './embeddings';
import { createServerClient } from './supabase';

const MATCH_THRESHOLD = 0.5;
const MATCH_COUNT = 5;

/**
 * Retrieve relevant chunks from a knowledge base for a query
 */
export async function retrieve(
    kbId: string,
    query: string
): Promise<string> {
    if (!query.trim()) return '';

    const embedding = await embedText(query);

    const supabase = createServerClient();

    const { data: chunks, error } = await supabase.rpc('match_chunks', {
        p_kb_id: kbId,
        p_query_embedding: embedding,
        p_match_threshold: MATCH_THRESHOLD,
        p_match_count: MATCH_COUNT,
    });

    if (error || !chunks || chunks.length === 0) {
        return '';
    }

    const content = (chunks as { content: string }[])
        .map((c) => c.content)
        .join('\n\n');

    return content;
}

/**
 * Format retrieved content for injection into system prompt
 */
export function formatKnowledgeBaseContext(retrieved: string): string {
    if (!retrieved.trim()) return '';

    return `\n--- Knowledge Base ---\n${retrieved}\n`;
}
