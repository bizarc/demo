/**
 * Knowledge Base: document parsing, chunking, and ingestion
 */

import { embedTexts } from './embeddings';

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_FILES_PER_KB = 10;
export const MAX_CHUNKS_PER_KB = 500;
export const CHUNK_SIZE_TOKENS = 768; // ~512-1024 target
export const CHUNK_OVERLAP_TOKENS = 64;

const APPROX_CHARS_PER_TOKEN = 4;

export type KbType =
    | 'product_catalog'
    | 'faq'
    | 'service_menu'
    | 'review_template'
    | 'custom';

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.csv', '.pdf'];

export function isSupportedFile(filename: string): boolean {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Parse document content by format
 */
export async function parseDocument(
    buffer: Buffer,
    filename: string
): Promise<string> {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));

    if (ext === '.txt' || ext === '.md') {
        return buffer.toString('utf-8');
    }

    if (ext === '.csv') {
        const text = buffer.toString('utf-8');
        // Parse CSV: each row becomes a chunk candidate
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        return lines.join('\n\n'); // Double newline for chunk boundary hint
    }

    if (ext === '.pdf') {
        const pdf = (await import('pdf-parse')).default;
        const data = await pdf(buffer);
        return data.text || '';
    }

    throw new Error(`Unsupported file format: ${ext}`);
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(
    text: string,
    options: {
        chunkSizeTokens?: number;
        overlapTokens?: number;
    } = {}
): string[] {
    const chunkSize = options.chunkSizeTokens ?? CHUNK_SIZE_TOKENS;
    const overlap = options.overlapTokens ?? CHUNK_OVERLAP_TOKENS;

    const chunkSizeChars = chunkSize * APPROX_CHARS_PER_TOKEN;
    const overlapChars = overlap * APPROX_CHARS_PER_TOKEN;
    const stepChars = chunkSizeChars - overlapChars;

    if (text.length <= chunkSizeChars) {
        return text.trim() ? [text.trim()] : [];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSizeChars;
        let chunk = text.slice(start, end);

        // Try to break at paragraph/sentence boundary
        if (end < text.length) {
            const lastNewline = chunk.lastIndexOf('\n\n');
            const lastSentence = chunk.search(/[.!?]\s+[A-Z]/);
            const breakPoint = Math.max(lastNewline, lastSentence);
            if (breakPoint > chunkSizeChars / 2) {
                chunk = chunk.slice(0, breakPoint + 1);
                end = start + chunk.length;
            }
        }

        const trimmed = chunk.trim();
        if (trimmed) chunks.push(trimmed);
        start += stepChars;
    }

    return chunks;
}

/**
 * Ingest a document: parse, chunk, embed, return chunks for storage
 */
export async function ingestDocument(
    buffer: Buffer,
    filename: string
): Promise<{ text: string; chunks: string[]; embeddings: number[][] }> {
    const text = await parseDocument(buffer, filename);
    if (!text.trim()) {
        throw new Error(`No content extracted from ${filename}`);
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
        throw new Error(`No chunks generated from ${filename}`);
    }

    // Batch embed (OpenRouter supports array input)
    const embeddings = await embedTexts(chunks);
    return { text, chunks, embeddings };
}
