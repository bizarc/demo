import { NextRequest } from 'next/server';
import { getOpenRouterClient, ChatMessage, OpenRouterClient } from '@/lib/openrouter';
import { buildSystemPrompt, MissionProfile } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase';

const TOKEN_LIMIT = 10000;
const MAX_HISTORY_MESSAGES = 50; // Cap history sent to LLM

/**
 * Check token usage for a demo by summing message token_count.
 * Falls back to in-memory tracking if tables don't exist yet.
 */
async function checkTokenLimit(
    supabase: ReturnType<typeof createServerClient>,
    demoId: string
): Promise<{ allowed: boolean; remaining: number }> {
    // Sum all token_count for messages in sessions belonging to this demo
    const { data, error } = await supabase
        .from('messages')
        .select('token_count, sessions!inner(demo_id)')
        .eq('sessions.demo_id', demoId);

    if (error) {
        // Tables may not exist yet — allow by default
        return { allowed: true, remaining: TOKEN_LIMIT };
    }

    const totalTokens = (data || []).reduce(
        (sum: number, msg: { token_count: number }) => sum + (msg.token_count || 0),
        0
    );
    const remaining = TOKEN_LIMIT - totalTokens;
    return { allowed: remaining > 0, remaining };
}

/**
 * Find or create a lead for this demo.
 * Uses an anonymous identifier (from cookie/header) for chat demos.
 */
async function findOrCreateLead(
    supabase: ReturnType<typeof createServerClient>,
    demoId: string,
    identifier: string,
    identifierType: 'email' | 'phone' | 'anonymous' = 'anonymous'
) {
    // Try to find existing lead
    const { data: existing } = await supabase
        .from('leads')
        .select('*')
        .eq('demo_id', demoId)
        .eq('identifier', identifier)
        .single();

    if (existing) {
        // Update last_seen_at
        await supabase
            .from('leads')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', existing.id);
        return existing;
    }

    // Create new lead
    const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
            demo_id: demoId,
            identifier,
            identifier_type: identifierType,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    return newLead!;
}

/**
 * Find or create a session for this lead.
 * A session is reused if it exists and hasn't ended.
 */
async function findOrCreateSession(
    supabase: ReturnType<typeof createServerClient>,
    leadId: string,
    demoId: string,
    channel: 'chat' | 'voice' | 'sms' = 'chat'
) {
    // Find active session (no ended_at)
    const { data: existing } = await supabase
        .from('sessions')
        .select('*')
        .eq('lead_id', leadId)
        .eq('demo_id', demoId)
        .eq('channel', channel)
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (existing) return existing;

    // Create new session
    const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({
            lead_id: leadId,
            demo_id: demoId,
            channel,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return newSession!;
}

/**
 * Load all messages for a lead across all sessions (unified history).
 * Returns messages in chronological order, capped at MAX_HISTORY_MESSAGES.
 */
async function loadLeadHistory(
    supabase: ReturnType<typeof createServerClient>,
    leadId: string
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    // Get all session IDs for this lead
    const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('lead_id', leadId);

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map(s => s.id);

    // Load messages from all sessions, ordered by time
    const { data: messages } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .in('session_id', sessionIds)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true });

    if (!messages) return [];

    // Take the most recent N messages
    const recent = messages.slice(-MAX_HISTORY_MESSAGES);
    return recent.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
    }));
}

/**
 * Save a message to the database.
 */
async function saveMessage(
    supabase: ReturnType<typeof createServerClient>,
    sessionId: string,
    role: 'system' | 'user' | 'assistant',
    content: string,
    tokenCount: number = 0
) {
    await supabase.from('messages').insert({
        session_id: sessionId,
        role,
        content,
        token_count: tokenCount,
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            demoId,
            message,
            // Client-side history fallback (used by builder preview)
            history = [],
            // Lead identification
            leadIdentifier,
            sessionId: existingSessionId,
        } = body;

        // Validate required fields
        if (!demoId || typeof demoId !== 'string') {
            return Response.json({ error: 'demoId is required' }, { status: 400 });
        }

        if (!message || typeof message !== 'string') {
            return Response.json({ error: 'message is required' }, { status: 400 });
        }

        const supabase = createServerClient();

        // Fetch demo configuration
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

        // Check token limit
        const { allowed, remaining } = await checkTokenLimit(supabase, demoId);
        if (!allowed) {
            return Response.json(
                { error: 'Token limit exceeded for this demo session' },
                { status: 429 }
            );
        }

        // Build system prompt
        const systemPrompt = demo.system_prompt || buildSystemPrompt(
            demo.mission_profile as MissionProfile,
            {
                companyName: demo.company_name,
                industry: demo.industry,
                products: demo.products_services,
                offers: demo.offers,
                qualificationCriteria: demo.qualification_criteria?.join(', '),
            }
        );

        // Determine message history
        let conversationHistory: { role: 'user' | 'assistant'; content: string }[];
        let sessionId: string | null = existingSessionId || null;

        if (leadIdentifier) {
            // Session-aware mode: find/create lead + session, load from DB
            try {
                const lead = await findOrCreateLead(supabase, demoId, leadIdentifier);
                const session = await findOrCreateSession(supabase, lead.id, demoId);
                sessionId = session.id;

                // Load unified history from DB
                conversationHistory = await loadLeadHistory(supabase, lead.id);

                // Save the incoming user message
                const userTokens = OpenRouterClient.estimateTokens(message);
                await saveMessage(supabase, sessionId, 'user', message, userTokens);
            } catch {
                // If conversation engine tables don't exist, fall back to client-side
                conversationHistory = history.map((msg: { role: string; content: string }) => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                }));
            }
        } else {
            // Client-side mode (builder preview): use history from request body
            conversationHistory = history.map((msg: { role: string; content: string }) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            }));
        }

        // Build messages array for LLM
        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            ...(leadIdentifier ? [] : [{ role: 'user' as const, content: message }]),
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
        let fullResponse = '';

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
                        fullResponse += token;

                        // Send as SSE format
                        const data = JSON.stringify({
                            token,
                            remaining: remaining - inputTokens - outputTokens,
                            sessionId,
                        });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }

                    // Save assistant response to DB if session-aware
                    if (sessionId && leadIdentifier) {
                        try {
                            await saveMessage(supabase, sessionId, 'assistant', fullResponse, outputTokens);
                        } catch {
                            // Silently fail if tables don't exist
                        }
                    }

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

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const demoId = searchParams.get('demoId');
    const leadIdentifier = searchParams.get('leadIdentifier');

    if (!demoId || !leadIdentifier) {
        return Response.json({ error: 'Missing demoId or leadIdentifier' }, { status: 400 });
    }

    const supabase = createServerClient();

    try {
        // Find lead
        const { data: lead } = await supabase
            .from('leads')
            .select('id')
            .eq('demo_id', demoId)
            .eq('identifier', leadIdentifier)
            .single();

        if (!lead) {
            return Response.json({ messages: [] });
        }

        // Get history
        const history = await loadLeadHistory(supabase, lead.id);
        return Response.json({ messages: history });
    } catch (error) {
        console.error('Fetch history error:', error);
        return Response.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
