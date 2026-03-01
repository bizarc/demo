import { describe, it, expect } from 'vitest';
import {
    MISSION_PROFILES,
    buildSystemPrompt,
    createInitialMessages,
    getSuggestedPrompts,
    MissionProfile,
} from '../prompts';

describe('MISSION_PROFILES', () => {
    const profiles: MissionProfile[] = [
        'database-reactivation',
        'inbound-nurture',
        'customer-service',
        'review-generation',
    ];

    it.each(profiles)('has a valid config for "%s"', (profile) => {
        const config = MISSION_PROFILES[profile];
        expect(config).toBeDefined();
        expect(config.id).toBe(profile);
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.icon).toBeTruthy();
        expect(config.systemPrompt).toContain('{{companyName}}');
        expect(config.suggestedPrompts.length).toBeGreaterThanOrEqual(1);
    });

    it('covers all four mission types', () => {
        expect(Object.keys(MISSION_PROFILES)).toHaveLength(4);
    });
});

describe('buildSystemPrompt', () => {
    it('replaces all template variables', () => {
        const result = buildSystemPrompt('database-reactivation', {
            companyName: 'Acme Corp',
            industry: 'Technology',
            agentContext: 'Products: Widget Pro, Widget Lite\nOffers: 20% off, Free trial\nQualifications: Budget > $10k'
        });

        expect(result).toContain('Acme Corp');
        expect(result).toContain('Technology');
        expect(result).toContain('Widget Pro, Widget Lite');
        expect(result).toContain('20% off, Free trial');
        expect(result).toContain('Budget > $10k');
        expect(result).not.toContain('{{');
    });

    it('uses default values when context is missing', () => {
        const result = buildSystemPrompt('inbound-nurture', {
            companyName: 'Test Co',
        });

        expect(result).toContain('Test Co');
        expect(result).toContain('General Business');
        expect(result).toContain('No additional context provided.');
        expect(result).not.toContain('{{');
    });

    it('handles null industry gracefully', () => {
        const result = buildSystemPrompt('customer-service', {
            companyName: 'Test',
            industry: null,
        });

        expect(result).toContain('General Business');
    });

    it('uses default fallback for agentContext if none is provided', () => {
        const result = buildSystemPrompt('review-generation', {
            companyName: 'Test',
        });

        expect(result).toContain('No additional context provided.');
    });

    it('generates different prompts for different profiles', () => {
        const context = { companyName: 'Test' };
        const reactivation = buildSystemPrompt('database-reactivation', context);
        const nurture = buildSystemPrompt('inbound-nurture', context);

        expect(reactivation).not.toBe(nurture);
    });

    it('appends mission-channel strategy when channel is provided', () => {
        const context = { companyName: 'Test' };
        const website = buildSystemPrompt('database-reactivation', context, 'website');
        const sms = buildSystemPrompt('database-reactivation', context, 'sms');

        expect(website).toContain('[WEBSITE STRATEGY — Reactivation]');
        expect(sms).toContain('[SMS STRATEGY — Reactivation]');
        expect(sms).toContain('under 160 chars');
        expect(sms).toContain('Reply YES to claim');
        expect(website).not.toContain('[SMS STRATEGY');
    });

    it('appends correct strategy for different missions on the same channel', () => {
        const context = { companyName: 'Test' };
        const service = buildSystemPrompt('customer-service', context, 'website');
        const review = buildSystemPrompt('review-generation', context, 'sms');

        expect(service).toContain('[WEBSITE STRATEGY — Customer Service]');
        expect(service).toContain('step-by-step');
        expect(review).toContain('[SMS STRATEGY — Review Generation]');
        expect(review).toContain('Reply 1–5 to rate us');
    });
});

describe('getSuggestedPrompts', () => {
    it('returns SMS variants for sms channel', () => {
        const sms = getSuggestedPrompts('database-reactivation', 'sms');
        const website = getSuggestedPrompts('database-reactivation', 'website');

        expect(sms[0]).not.toBe(website[0]);
        expect(sms[0].length).toBeLessThanOrEqual(website[0].length + 20); // SMS tends shorter
    });

    it('returns voice variants for voice channel', () => {
        const voice = getSuggestedPrompts('customer-service', 'voice');
        const website = getSuggestedPrompts('customer-service', 'website');

        expect(voice[0]).not.toBe(website[0]);
        expect(voice[0]).toContain('calling');
    });

    it('falls back to default prompts for channels without specific variants', () => {
        const messenger = getSuggestedPrompts('database-reactivation', 'messenger');
        const website = getSuggestedPrompts('database-reactivation', 'website');

        expect(messenger).toEqual(website);
    });
});

describe('createInitialMessages', () => {
    it('returns system and assistant messages', () => {
        const messages = createInitialMessages('database-reactivation', 'System prompt content');

        expect(messages).toHaveLength(2);
        expect(messages[0].role).toBe('system');
        expect(messages[0].content).toBe('System prompt content');
        expect(messages[1].role).toBe('assistant');
        expect(messages[1].content).toBeTruthy();
    });

    it('uses the first suggested prompt as the initial message', () => {
        const profile: MissionProfile = 'inbound-nurture';
        const messages = createInitialMessages(profile, 'test');

        expect(messages[1].content).toBe(MISSION_PROFILES[profile].suggestedPrompts[0]);
    });
});
