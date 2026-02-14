/**
 * Shared chat engine logic for streaming and sync (SMS, Voice, etc.) responses.
 * Used by /api/chat (streaming) and /api/twilio/sms (sync).
 */

import { ChatMessage } from './openrouter';
import { getOpenRouterClient, OpenRouterClient } from './openrouter';
import { buildSystemPrompt, MissionProfile, Channel } from './prompts';
import { retrieve, formatKnowledgeBaseContext } from './retrieval';
import { sanitizeString, LIMITS } from './validation';

export interface ProcessMessageResult {
    content: string;
    sessionId: string | null;
}

/**
 * Get AI response for a message (non-streaming).
 * Used by Twilio webhook and other sync channels.
 */
export async function processMessageSync(
    params: {
        demo: {
            id: string;
            company_name: string | null;
            industry: string | null;
            products_services?: string[] | null;
            offers?: string[] | null;
            qualification_criteria?: string[] | null;
            mission_profile?: string | null;
            system_prompt?: string | null;
            openrouter_model?: string | null;
            channel?: string | null;
            knowledge_base_id?: string | null;
            status?: string;
        };
        leadIdentifier: string;
        message: string;
        history: { role: 'user' | 'assistant'; content: string }[];
        channel: 'chat' | 'sms' | 'voice' | 'messenger' | 'email';
        sessionId: string | null;
        saveMessageFn: (sessionId: string, role: 'user' | 'assistant', content: string, tokenCount: number) => Promise<void>;
    }
): Promise<ProcessMessageResult> {
    const { demo, leadIdentifier, message, history, sessionId, saveMessageFn } = params;
    const sanitizedMessage = sanitizeString(message, LIMITS.messageContent);
    if (!sanitizedMessage) throw new Error('Message required');

    let systemPrompt: string;
    if (demo.system_prompt) {
        systemPrompt = demo.system_prompt;
    } else if (demo.mission_profile) {
        const DB_TO_PROFILE: Record<string, MissionProfile> = {
            reactivation: 'database-reactivation',
            nurture: 'inbound-nurture',
            service: 'customer-service',
            review: 'review-generation',
        };
        const fullProfile = DB_TO_PROFILE[demo.mission_profile] || 'inbound-nurture';
        const ch = ['sms', 'messenger', 'email', 'website', 'voice'].includes(demo.channel as string)
            ? (demo.channel as Channel)
            : 'website';
        systemPrompt = buildSystemPrompt(fullProfile, {
            companyName: demo.company_name || 'Company',
            industry: demo.industry,
            products: demo.products_services || [],
            offers: demo.offers || [],
            qualificationCriteria: demo.qualification_criteria?.join(', '),
        }, ch);
    } else {
        systemPrompt = `You are a helpful AI assistant for ${demo.company_name || 'a company'}. Be professional and helpful.`;
    }

    const kbId = demo.knowledge_base_id as string | null | undefined;
    if (kbId) {
        try {
            const retrieved = await retrieve(kbId, sanitizedMessage);
            systemPrompt += formatKnowledgeBaseContext(retrieved);
        } catch {
            // Continue without KB context
        }
    }

    const conversationHistory = history.slice(-LIMITS.historyMessages);
    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
        { role: 'user', content: sanitizedMessage },
    ];

    const client = getOpenRouterClient();
    if (!client.isConfigured()) throw new Error('AI service not configured');

    const fullResponse = await client.chat(
        messages,
        demo.openrouter_model || 'openai/gpt-4o-mini',
        { temperature: 0.7, maxTokens: 1024 }
    );

    if (sessionId && leadIdentifier && demo.status !== 'draft') {
        const outputTokens = OpenRouterClient.estimateTokens(fullResponse);
        await saveMessageFn(sessionId, 'assistant', fullResponse, outputTokens);
    }

    return { content: fullResponse, sessionId };
}
