/**
 * OpenRouter Embeddings API client for RAG
 * Uses openai/text-embedding-3-small (1536 dimensions)
 */

const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResponse {
    embedding: number[];
    totalTokens?: number;
}

/**
 * Generate embeddings for text via OpenRouter
 */
export async function embedText(
    text: string,
    apiKey?: string
): Promise<number[]> {
    const key = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!key) {
        throw new Error('OPENROUTER_API_KEY is required for embeddings');
    }

    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'The Lab Demo',
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: text,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error.error?.message || `OpenRouter embeddings error: ${response.status}`
        );
    }

    const data = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
    };
    const embedding = data.data?.[0]?.embedding;
    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error('Invalid embedding response');
    }
    return embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch (max 2048 inputs per request)
 */
export async function embedTexts(
    texts: string[],
    apiKey?: string
): Promise<number[][]> {
    if (texts.length === 0) return [];

    const key = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!key) {
        throw new Error('OPENROUTER_API_KEY is required for embeddings');
    }

    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'The Lab Demo',
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: texts,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error.error?.message || `OpenRouter embeddings error: ${response.status}`
        );
    }

    const data = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
    };
    const embeddings = (data.data || []).map((d) => d.embedding);
    if (embeddings.length !== texts.length) {
        throw new Error(`Expected ${texts.length} embeddings, got ${embeddings.length}`);
    }
    return embeddings;
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
