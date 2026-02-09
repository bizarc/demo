import { NextRequest } from 'next/server';
import { getOpenRouterClient, ChatMessage, OpenRouterClient } from '@/lib/openrouter';
import { buildSystemPrompt, MissionProfile } from '@/lib/prompts';
import { createClient } from '@supabase/supabase-js';

// Token tracking per demo session
const tokenUsage = new Map<string, { tokens: number; lastReset: number }>();
const TOKEN_LIMIT = 10000;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

function checkTokenLimit(demoId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const usage = tokenUsage.get(demoId);

    // Reset if expired
    if (!usage || now - usage.lastReset > RESET_INTERVAL) {
        tokenUsage.set(demoId, { tokens: 0, lastReset: now });
        return { allowed: true, remaining: TOKEN_LIMIT };
    }

    const remaining = TOKEN_LIMIT - usage.tokens;
    return { allowed: remaining > 0, remaining };
}

function trackTokens(demoId: string, tokens: number): void {
    const usage = tokenUsage.get(demoId);
    if (usage) {
        usage.tokens += tokens;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { demoId, message, history = [] } = body;

        // Validate required fields
        if (!demoId || typeof demoId !== 'string') {
            return Response.json({ error: 'demoId is required' }, { status: 400 });
        }

        if (!message || typeof message !== 'string') {
            return Response.json({ error: 'message is required' }, { status: 400 });
        }

        // Check token limit
        const { allowed, remaining } = checkTokenLimit(demoId);
        if (!allowed) {
            return Response.json(
                { error: 'Token limit exceeded for this demo session' },
                { status: 429 }
            );
        }

        // Fetch demo configuration from Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: demo, error: fetchError } = await supabase
            .from('demos')
            .select('*')
            .eq('id', demoId)
            .single();

        if (fetchError || !demo) {
            return Response.json({ error: 'Demo not found' }, { status: 404 });
        }

        // Check if demo is expired
        if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
            return Response.json({ error: 'Demo has expired' }, { status: 410 });
        }

        // Build messages array
        const systemPrompt = demo.system_prompt || buildSystemPrompt(
            demo.mission_profile as MissionProfile,
            {
                companyName: demo.company_name,
                industry: demo.industry,
                products: demo.products_services?.split(',').map((s: string) => s.trim()),
                offers: demo.offers?.split(',').map((s: string) => s.trim()),
                qualificationCriteria: demo.qualification_criteria,
            }
        );

        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...history.map((msg: { role: string; content: string }) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user', content: message },
        ];

        // Estimate input tokens
        const inputTokens = OpenRouterClient.estimateTokens(
            messages.map(m => m.content).join(' ')
        );

        // Initialize OpenRouter client
        const client = getOpenRouterClient();

        if (!client.isConfigured()) {
            return Response.json(
                { error: 'AI service not configured' },
                { status: 503 }
            );
        }

        // Create streaming response
        const encoder = new TextEncoder();
        let outputTokens = 0;

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const generator = client.chatStream(
                        messages,
                        demo.openrouter_model || 'openai/gpt-4o-mini',
                        { temperature: 0.7, maxTokens: 1024 }
                    );

                    for await (const token of generator) {
                        outputTokens += OpenRouterClient.estimateTokens(token);

                        // Send as SSE format
                        const data = JSON.stringify({ token, remaining: remaining - inputTokens - outputTokens });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }

                    // Track total tokens used
                    trackTokens(demoId, inputTokens + outputTokens);

                    // Send completion event
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                    controller.close();
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Stream error';
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return Response.json({ error: message }, { status: 500 });
    }
}
