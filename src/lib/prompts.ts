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

/**
 * Mission × Channel strategy instructions.
 * Provides tactical guidance on HOW to execute each mission on each channel.
 * Appended to the system prompt after mission identity and agentContext.
 */
const MISSION_CHANNEL_STRATEGY: Record<MissionProfile, Partial<Record<Channel, string>>> = {
    'database-reactivation': {
        sms: `[SMS STRATEGY — Reactivation]
- Open with ONE short hook question (under 160 chars). Do NOT pitch on the first message.
- If they reply, send the win-back offer in the second message. Keep it under 160 chars.
- Never send more than 2 texts without a reply. If no response, stop.
- No markdown, no links. Plain text only.
- CTA: "Reply YES to claim" or "Reply STOP to opt out".
- Compliance: Include opt-out language in the first outbound message.`,
        messenger: `[MESSENGER STRATEGY — Reactivation]
- Friendly, casual tone. 1–2 short paragraphs max per message.
- Open with a personal check-in, then pivot to value.
- Can include links and simple formatting.
- Quick back-and-forth. Don't front-load information.
- CTA: "Tap here to see what's new" or "Reply to get your offer".`,
        email: `[EMAIL STRATEGY — Reactivation]
- Professional subject line referencing the past relationship (e.g., "We miss you, {{companyName}} update").
- Open with a warm greeting. One clear value proposition.
- One primary CTA (reply or click). Keep body under 150 words.
- Sign off warmly. No excessive formatting.`,
        website: `[WEBSITE STRATEGY — Reactivation]
- Open conversationally. Reference that it's been a while since they last engaged.
- Ask about their current situation and needs before pitching.
- Use markdown (bold, bullets) for readability when listing features or offers.
- Guide toward booking a call or claiming the returning-customer offer.
- Match the visitor's pace — don't rush to the close.`,
        voice: `[VOICE STRATEGY — Reactivation]
- Greet warmly by name if available. Keep sentences short and natural.
- Ask one open-ended question about their current situation, then listen.
- Pitch the win-back offer only if they express interest or openness.
- Confirm next steps verbally: "Would you like me to send you the details?"
- If they decline, thank them and offer to stay in touch.`,
    },
    'inbound-nurture': {
        sms: `[SMS STRATEGY — Inbound Nurture]
- Welcome briefly (under 160 chars). Ask one qualifying question per message.
- Keep each response under 160 characters. One idea per message.
- After qualifying, direct them to book a call or visit a link.
- No markdown. Plain text only.
- CTA: "Reply DEMO to book" or "Reply with your biggest challenge".`,
        messenger: `[MESSENGER STRATEGY — Inbound Nurture]
- Friendly, helpful tone. 1–3 short paragraphs.
- Ask qualifying questions naturally in conversation flow.
- Can share links to product pages, demos, or calendars.
- Guide qualified leads toward a clear next step.
- CTA: "Tap here to book your demo" or "Which of these interests you most?"`,
        email: `[EMAIL STRATEGY — Inbound Nurture]
- Professional but warm. Educational tone — provide value first.
- Structure: Hook → Value → Qualifying question → CTA.
- One primary CTA per email (book demo, start trial, reply).
- Can use bullet points for feature lists. Keep under 200 words.`,
        website: `[WEBSITE STRATEGY — Inbound Nurture]
- Conversational and helpful. Natural dialogue length.
- Ask qualifying questions to understand needs: timeline, budget, decision process.
- Provide accurate, detailed info about products/services when asked.
- Can include links, bullets, and markdown when helpful.
- Guide toward next steps once qualified: demo, trial, or consultation.`,
        voice: `[VOICE STRATEGY — Inbound Nurture]
- Warm, consultative tone. Short sentences. Confirm understanding.
- Ask open-ended qualifying questions: "What prompted you to reach out today?"
- Listen actively. Summarize what you hear before pitching.
- Clear verbal CTA: "Would you like to schedule a walkthrough this week?"
- If not ready, offer to send information: "Can I email you a quick summary?"`,
    },
    'customer-service': {
        sms: `[SMS STRATEGY — Customer Service]
- Acknowledge the issue immediately. Keep under 160 chars.
- Ask one clarifying question per message if needed.
- Provide concise resolution steps. Break long instructions across messages.
- If unresolvable via text, offer: "Reply CALL for a callback."
- No markdown. Plain text only.`,
        messenger: `[MESSENGER STRATEGY — Customer Service]
- Empathetic and responsive. Medium-length messages (1–2 paragraphs).
- Acknowledge the issue and reassure them you can help.
- Can share links to help articles or status pages.
- Provide step-by-step troubleshooting with clear formatting.
- Escalation: "I'll connect you with a specialist. They'll message you shortly."`,
        email: `[EMAIL STRATEGY — Customer Service]
- Professional, empathetic tone. Reference their specific issue.
- Structured response: Acknowledgment → Resolution steps → Next steps.
- Use numbered lists for multi-step instructions.
- Clear CTA: "Reply to this email if you need further assistance."
- Sign off with reassurance and contact information.`,
        website: `[WEBSITE STRATEGY — Customer Service]
- Empathetic, patient, and thorough. Natural dialogue length.
- Acknowledge the issue first, then troubleshoot step-by-step.
- Use markdown: numbered lists for instructions, bold for key actions.
- Ask clarifying questions before assuming the problem.
- If you cannot resolve it, offer clear escalation: "Let me connect you with our team."`,
        voice: `[VOICE STRATEGY — Customer Service]
- Calm, empathetic, patient. Short sentences spoken naturally.
- Acknowledge feelings first: "I understand that's frustrating."
- Walk through troubleshooting one step at a time. Confirm each step.
- No jargon. Use plain language.
- Escalation: "I'd like to transfer you to a specialist who can help with this."`,
    },
    'review-generation': {
        sms: `[SMS STRATEGY — Review Generation]
- Open with one grateful message (under 160 chars): "Thanks for choosing us!"
- Ask for a review in the second message with a simple CTA.
- CTA: "Reply 1–5 to rate us" or "Tap here to leave a quick review."
- If they express dissatisfaction, pivot to support: "Sorry to hear that. How can we make it right?"
- No markdown. Plain text only. Max 2 messages before waiting for reply.`,
        messenger: `[MESSENGER STRATEGY — Review Generation]
- Warm, appreciative tone. 1–2 short paragraphs.
- Thank them for their business. Ask about their experience.
- Share a direct review link when they express satisfaction.
- If negative feedback, acknowledge and offer to help before asking for review.
- CTA: "Tap here to share your experience" or "Would you leave us a quick review?"`,
        email: `[EMAIL STRATEGY — Review Generation]
- Grateful, personal tone. Reference their specific purchase or service.
- Structure: Thank you → Quick check-in → Review ask → Incentive (if any).
- One clear CTA button/link to the review platform.
- Keep under 100 words. Make it effortless.`,
        website: `[WEBSITE STRATEGY — Review Generation]
- Conversational and genuine. Don't rush to the ask.
- Check in on their experience first. Let them share organically.
- If positive, guide them to leave a review with a link or instructions.
- If negative, empathize and offer to resolve before asking for review.
- Never pressure. Be gracious regardless of outcome.`,
        voice: `[VOICE STRATEGY — Review Generation]
- Grateful, warm tone. Reference their visit or purchase specifically.
- Ask how their experience was before requesting a review.
- If positive: "Would you be willing to share that in a quick review? I can text you a link."
- If negative: "I'm sorry to hear that. Let me see what I can do to help."
- Keep it brief. Confirm how they'd like to receive the review link.`,
    },
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
    /** Channel-specific suggested prompt variants */
    suggestedPromptsByChannel?: Partial<Record<Channel, string[]>>;
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

Context:
{{agentContext}}
{{knowledgeBaseContext}}

Always be helpful, conversational, and focus on understanding their needs before pitching. If they're not interested, gracefully accept and offer to stay in touch.`,
        suggestedPrompts: [
            "Hi! I noticed we haven't connected in a while. How have things been?",
            "What's been keeping you busy lately?",
            "Are you still looking for solutions in this area?",
            "Would you be interested in hearing about our latest updates?",
        ],
        suggestedPromptsByChannel: {
            sms: [
                "Hi! We haven't connected in a while. How are things?",
                "Still looking for solutions? We have updates.",
                "Reply YES to hear about our latest offers.",
            ],
            voice: [
                "Hi there! It's been a while since we connected. How have things been?",
                "I'm calling to check in — are you still in the market?",
            ],
        },
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

Context:
{{agentContext}}
{{knowledgeBaseContext}}

Be helpful and informative without being pushy. Focus on education and value rather than aggressive sales tactics.`,
        suggestedPrompts: [
            "Welcome! What brings you here today?",
            "I'd love to learn more about what you're looking for.",
            "Do you have any specific questions I can help with?",
            "Would you like me to walk you through our options?",
        ],
        suggestedPromptsByChannel: {
            sms: [
                "Welcome! What can I help you with?",
                "Any questions? Reply here.",
                "Reply to get started.",
            ],
            voice: [
                "Thanks for calling! What can I help you with today?",
                "I'd love to learn more about what you're looking for.",
            ],
        },
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

Context:
{{agentContext}}
{{knowledgeBaseContext}}

Always prioritize customer satisfaction. If you can't solve an issue, acknowledge it and offer to connect them with someone who can.`,
        suggestedPrompts: [
            "How can I help you today?",
            "I'm sorry to hear you're experiencing issues. Let me help.",
            "Can you tell me more about what's happening?",
            "Is there anything else I can assist you with?",
        ],
        suggestedPromptsByChannel: {
            sms: [
                "How can I help? Reply here.",
                "Tell me what's going on.",
                "I'm here to help.",
            ],
            voice: [
                "Thanks for calling. How can I help you today?",
                "I'm here to help. What's going on?",
            ],
        },
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

Context:
{{agentContext}}
{{knowledgeBaseContext}}

Be genuine and appreciative. Never pressure customers to leave reviews, and always handle negative experiences with empathy and a desire to improve.`,
        suggestedPrompts: [
            "We'd love to hear about your experience with us!",
            "How has our product/service been working for you?",
            "Would you be willing to share your feedback?",
            "Your review would really help other customers like you.",
        ],
        suggestedPromptsByChannel: {
            sms: [
                "How was your experience? We'd love your feedback!",
                "Reply to leave a quick review.",
                "Thanks for choosing us! Would you share your thoughts?",
            ],
            voice: [
                "Thanks so much for your visit! How was your experience?",
                "Would you be willing to share your thoughts in a quick review?",
            ],
        },
    },
};

/**
 * Build the system prompt with company context and channel.
 * Composes: mission identity → agentContext → mission-channel strategy.
 * Falls back to generic CHANNEL_INSTRUCTIONS for uncovered combinations.
 */
export function buildSystemPrompt(
    profile: MissionProfile,
    context: {
        companyName: string;
        industry?: string | null;
        agentContext?: string;
        knowledgeBaseContext?: string;
    },
    channel: Channel = 'website'
): string {
    const config = MISSION_PROFILES[profile];

    let prompt = config.systemPrompt
        .replace(/\{\{companyName\}\}/g, context.companyName)
        .replace(/\{\{industry\}\}/g, context.industry || 'General Business')
        .replace(/\{\{agentContext\}\}/g, context.agentContext || 'No additional context provided.');

    // Handle knowledge base context (RAG retrieval)
    prompt = prompt.replace(
        /\{\{knowledgeBaseContext\}\}/g,
        context.knowledgeBaseContext || ''
    );

    // Append mission-channel strategy (tactical instructions)
    // Falls back to generic channel rules for uncovered combinations
    const strategy = MISSION_CHANNEL_STRATEGY[profile]?.[channel];
    prompt = prompt.trim() + '\n\n' + (strategy || CHANNEL_INSTRUCTIONS[channel]);

    return prompt.trim();
}

/**
 * Get suggested prompts for a mission, channel-aware.
 * Checks suggestedPromptsByChannel[channel] first, then falls back to suggestedPrompts.
 */
export function getSuggestedPrompts(profile: MissionProfile, channel: Channel = 'website'): string[] {
    const config = MISSION_PROFILES[profile];
    const channelPrompts = config.suggestedPromptsByChannel?.[channel];
    if (channelPrompts?.length) {
        return channelPrompts;
    }
    return config.suggestedPrompts;
}

/**
 * Create initial messages for a chat session.
 * Uses channel-specific suggested prompts when available.
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

/**
 * Pre-filled templates for the builder UI context step.
 */
export const MISSION_CONTEXT_TEMPLATES: Record<MissionProfile, string> = {
    'database-reactivation': `Offerings:
[List products or services to re-pitch]

Win-back offer:
[Incentive for returning customers, e.g., 20% off your next order]

Target re-engagement signals:
[e.g., Previously purchased X, hasn't bought in 6 months]`,

    'inbound-nurture': `Products/Services:
[List products or services available]

Trial or demo offer:
[e.g., 14-day free trial, Book a free consultation]

Qualification questions:
[e.g., What is your timeline? What is your budget?]`,

    'customer-service': `Services supported:
[List products or services the agent can troubleshoot]

Common issues:
[e.g., Billing questions, Password resets, Delivery delays]

Escalation policy:
[e.g., If the customer asks for a refund, transfer to human]`,

    'review-generation': `Service delivered:
[What did the customer buy or experience?]

Review incentive (optional):
[e.g., Get 10% off your next order for leaving a review]

Target audience:
[e.g., Recent purchasers, High satisfaction rating]`,
};

/**
 * Build the initial text for the ContextStep textarea based on scrape results.
 */
export function buildMissionContextTemplate(profile: MissionProfile, scrapeResult: any): string {
    const template = MISSION_CONTEXT_TEMPLATES[profile];

    // Simple replacement if scrape data exists
    let context = template;

    if (scrapeResult.products && scrapeResult.products.length > 0) {
        context = context.replace(
            /\[List products or services.*?\]/i,
            scrapeResult.products.join(', ')
        );
    }

    if (scrapeResult.offers && scrapeResult.offers.length > 0) {
        context = context.replace(
            /\[(?:Incentive|e\.g\.,.*?discount|Trial or demo).*?\]/i,
            scrapeResult.offers.join(', ')
        );
    }

    return context;
}
