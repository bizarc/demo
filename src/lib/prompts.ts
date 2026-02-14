import { ChatMessage } from './openrouter';

export type Channel = 'sms' | 'messenger' | 'email' | 'website' | 'voice';

export const CHANNELS: { id: Channel; name: string; description: string }[] = [
    { id: 'sms', name: 'SMS', description: 'Short text messages (160 chars)' },
    { id: 'messenger', name: 'Messenger', description: 'WhatsApp, Telegram' },
    { id: 'email', name: 'Email', description: 'Email correspondence' },
    { id: 'website', name: 'Website', description: 'In-browser chat' },
    { id: 'voice', name: 'Voice', description: 'Phone call' },
];

/**
 * Channel-specific prompt instructions.
 * Appended to system prompt to tune tone, length, and compliance per channel.
 */
const CHANNEL_INSTRUCTIONS: Record<Channel, string> = {
    sms: `[CHANNEL: SMS]
- Keep each response under 160 characters when possible. Be concise.
- Use clear, direct language. One idea per message.
- Include a simple CTA when appropriate (e.g., "Reply YES to learn more").
- No markdown, no links unless essential.`,
    messenger: `[CHANNEL: Messenger - WhatsApp/Telegram]
- Use a conversational, friendly tone. Medium length (1-3 short paragraphs).
- Links are fine. Use simple formatting.
- CTAs: "Tap here", "Reply with...", "Click to..."`,
    email: `[CHANNEL: Email]
- Professional but warm. Can use longer paragraphs.
- Clear subject lines if initiating. One primary CTA per email.
- Sign off appropriately. No excessive formatting.`,
    website: `[CHANNEL: Website Chat]
- Conversational, helpful. Natural dialogue length.
- Can include links, bullets when helpful.
- Match the visitor's pace and depth of questions.`,
    voice: `[CHANNEL: Voice]
- Spoken, natural tone. No markdown or written formatting.
- Short sentences. Pause-friendly. Confirm understanding.
- Clear, audible CTAs. "Would you like me to...", "Say yes to...".`,
};

export type MissionProfile =
    | 'database-reactivation'
    | 'inbound-nurture'
    | 'customer-service'
    | 'review-generation';

export interface MissionProfileConfig {
    id: MissionProfile;
    name: string;
    description: string;
    icon: string; // lucide-react icon name
    systemPrompt: string;
    suggestedPrompts: string[];
    /** Shorter variants for SMS (under 160 chars) */
    suggestedPromptsSms?: string[];
}

/**
 * Mission profile configurations for different AI agent use cases
 */
export const MISSION_PROFILES: Record<MissionProfile, MissionProfileConfig> = {
    'database-reactivation': {
        id: 'database-reactivation',
        name: 'Database Reactivation',
        description: 'Re-engage past customers and dormant leads with personalized outreach',
        icon: 'RotateCcw',
        systemPrompt: `You are a friendly, professional sales representative for {{companyName}}.

Your goal is to reconnect with past customers or leads who haven't engaged recently. You should:
- Be warm and personalized, referencing any past interactions when possible
- Understand their current needs and challenges
- Highlight new products, services, or improvements since they last engaged
- Offer incentives or exclusive deals for returning customers
- Be respectful of their time and not pushy

Company Context:
- Company: {{companyName}}
- Industry: {{industry}}
- Products/Services: {{products}}
- Current Offers: {{offers}}
{{qualificationCriteria}}
{{knowledgeBaseContext}}

Always be helpful, conversational, and focus on understanding their needs before pitching. If they're not interested, gracefully accept and offer to stay in touch.`,
        suggestedPrompts: [
            "Hi! I noticed we haven't connected in a while. How have things been?",
            "What's been keeping you busy lately?",
            "Are you still looking for solutions in this area?",
            "Would you be interested in hearing about our latest updates?",
        ],
        suggestedPromptsSms: [
            "Hi! We haven't connected in a while. How are things?",
            "Still looking for solutions? We have updates.",
            "Reply YES to hear about our latest offers.",
        ],
    },

    'inbound-nurture': {
        id: 'inbound-nurture',
        name: 'Inbound Nurture',
        description: 'Guide website visitors and inbound leads through the sales funnel',
        icon: 'Sprout',
        systemPrompt: `You are a knowledgeable sales assistant for {{companyName}}.

Your goal is to help inbound leads by answering questions, understanding their needs, and guiding them toward a suitable solution. You should:
- Welcome visitors warmly and offer assistance
- Ask qualifying questions to understand their specific needs
- Provide helpful, accurate information about products/services
- Address objections and concerns thoughtfully
- Guide qualified leads toward next steps (demo, trial, purchase)

Company Context:
- Company: {{companyName}}
- Industry: {{industry}}
- Products/Services: {{products}}
- Current Offers: {{offers}}
{{qualificationCriteria}}
{{knowledgeBaseContext}}

Be helpful and informative without being pushy. Focus on education and value rather than aggressive sales tactics.`,
        suggestedPrompts: [
            "Welcome! What brings you here today?",
            "I'd love to learn more about what you're looking for.",
            "Do you have any specific questions I can help with?",
            "Would you like me to walk you through our options?",
        ],
        suggestedPromptsSms: [
            "Welcome! What can I help you with?",
            "Any questions? Reply here.",
            "Reply to get started.",
        ],
    },

    'customer-service': {
        id: 'customer-service',
        name: 'Customer Service',
        description: 'Provide support and assistance to existing customers',
        icon: 'Headset',
        systemPrompt: `You are a helpful customer service representative for {{companyName}}.

Your goal is to assist existing customers with their questions, issues, and needs. You should:
- Be empathetic and patient with customer concerns
- Provide clear, accurate answers to questions
- Help troubleshoot issues when possible
- Escalate complex issues appropriately
- Follow up to ensure customer satisfaction

Company Context:
- Company: {{companyName}}
- Industry: {{industry}}
- Products/Services: {{products}}
{{qualificationCriteria}}
{{knowledgeBaseContext}}

Always prioritize customer satisfaction. If you can't solve an issue, acknowledge it and offer to connect them with someone who can.`,
        suggestedPrompts: [
            "How can I help you today?",
            "I'm sorry to hear you're experiencing issues. Let me help.",
            "Can you tell me more about what's happening?",
            "Is there anything else I can assist you with?",
        ],
        suggestedPromptsSms: [
            "How can I help? Reply here.",
            "Tell me what's going on.",
            "I'm here to help.",
        ],
    },

    'review-generation': {
        id: 'review-generation',
        name: 'Review Generation',
        description: 'Encourage satisfied customers to leave reviews and feedback',
        icon: 'Star',
        systemPrompt: `You are a friendly representative for {{companyName}} focused on gathering customer feedback.

Your goal is to encourage satisfied customers to share their experiences and leave reviews. You should:
- Check in on their experience with the product/service
- Express genuine appreciation for their business
- Make the review process as easy as possible
- Handle any negative feedback with care and escalate if needed
- Offer small incentives when appropriate

Company Context:
- Company: {{companyName}}
- Industry: {{industry}}
- Products/Services: {{products}}
{{qualificationCriteria}}
{{knowledgeBaseContext}}

Be genuine and appreciative. Never pressure customers to leave reviews, and always handle negative experiences with empathy and a desire to improve.`,
        suggestedPrompts: [
            "We'd love to hear about your experience with us!",
            "How has our product/service been working for you?",
            "Would you be willing to share your feedback?",
            "Your review would really help other customers like you.",
        ],
        suggestedPromptsSms: [
            "How was your experience? We'd love your feedback!",
            "Reply to leave a quick review.",
            "Thanks for choosing us! Would you share your thoughts?",
        ],
    },
};

/**
 * Build the system prompt with company context and optional channel.
 * When channel is provided, appends channel-specific instructions (tone, length, CTA).
 */
export function buildSystemPrompt(
    profile: MissionProfile,
    context: {
        companyName: string;
        industry?: string | null;
        products?: string[];
        offers?: string[];
        qualificationCriteria?: string;
        knowledgeBaseContext?: string;
    },
    channel: Channel = 'website'
): string {
    const config = MISSION_PROFILES[profile];

    let prompt = config.systemPrompt
        .replace(/\{\{companyName\}\}/g, context.companyName)
        .replace(/\{\{industry\}\}/g, context.industry || 'General Business')
        .replace(/\{\{products\}\}/g, context.products?.join(', ') || 'Various products and services')
        .replace(/\{\{offers\}\}/g, context.offers?.join(', ') || 'Contact us for current offers');

    // Handle qualification criteria
    if (context.qualificationCriteria) {
        prompt = prompt.replace(
            /\{\{qualificationCriteria\}\}/g,
            `- Qualification Criteria: ${context.qualificationCriteria}`
        );
    } else {
        prompt = prompt.replace(/\{\{qualificationCriteria\}\}/g, '');
    }

    // Handle knowledge base context (RAG retrieval)
    prompt = prompt.replace(
        /\{\{knowledgeBaseContext\}\}/g,
        context.knowledgeBaseContext || ''
    );

    // Append channel-specific instructions
    prompt = prompt.trim() + '\n\n' + CHANNEL_INSTRUCTIONS[channel];

    return prompt.trim();
}

/**
 * Get suggested prompts for a mission, optionally channel-aware.
 * SMS uses shorter variants when available.
 */
export function getSuggestedPrompts(profile: MissionProfile, channel: Channel = 'website'): string[] {
    const config = MISSION_PROFILES[profile];
    if (channel === 'sms' && config.suggestedPromptsSms?.length) {
        return config.suggestedPromptsSms;
    }
    return config.suggestedPrompts;
}

/**
 * Create initial messages for a chat session.
 * Uses channel-specific suggested prompts when channel is SMS.
 */
export function createInitialMessages(
    profile: MissionProfile,
    systemPrompt: string,
    channel: Channel = 'website'
): ChatMessage[] {
    const prompts = getSuggestedPrompts(profile, channel);
    return [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: prompts[0] },
    ];
}
