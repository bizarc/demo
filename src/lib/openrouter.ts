export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenRouterModel {
    id: string;
    name: string;
    contextLength: number;
    pricing: {
        prompt: number; // per million tokens
        completion: number;
    };
}

// Popular models for demo purposes
export const AVAILABLE_MODELS: OpenRouterModel[] = [
    {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        contextLength: 200000,
        pricing: { prompt: 3, completion: 15 },
    },
    {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        contextLength: 128000,
        pricing: { prompt: 2.5, completion: 10 },
    },
    {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        contextLength: 128000,
        pricing: { prompt: 0.15, completion: 0.6 },
    },
    {
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
        contextLength: 1000000,
        pricing: { prompt: 0.1, completion: 0.4 },
    },
    {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B',
        contextLength: 131072,
        pricing: { prompt: 0.52, completion: 0.75 },
    },
];

export interface StreamCallbacks {
    onToken?: (token: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
}

/**
 * OpenRouter API client for chat completions
 */
export class OpenRouterClient {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
        if (!this.apiKey) {
            console.warn('OpenRouter API key not configured');
        }
    }

    /**
     * Create a chat completion (non-streaming)
     */
    async chat(
        messages: ChatMessage[],
        model: string = 'openai/gpt-4o-mini',
        options: { temperature?: number; maxTokens?: number } = {}
    ): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'The Lab Demo',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 1024,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * Create a streaming chat completion
     */
    async *chatStream(
        messages: ChatMessage[],
        model: string = 'openai/gpt-4o-mini',
        options: { temperature?: number; maxTokens?: number } = {}
    ): AsyncGenerator<string, void, unknown> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'The Lab Demo',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 1024,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const token = parsed.choices?.[0]?.delta?.content;
                        if (token) yield token;
                    } catch {
                        // Ignore parse errors for malformed chunks
                    }
                }
            }
        }
    }

    /**
     * Estimate token count (rough approximation)
     */
    static estimateTokens(text: string): number {
        // Rough estimate: ~4 characters per token for English
        return Math.ceil(text.length / 4);
    }

    /**
     * Check if API key is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

// Default singleton instance
let defaultClient: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
    if (!defaultClient) {
        defaultClient = new OpenRouterClient();
    }
    return defaultClient;
}
