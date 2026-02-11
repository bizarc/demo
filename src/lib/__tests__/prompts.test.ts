import { describe, it, expect } from 'vitest';
import {
    MISSION_PROFILES,
    buildSystemPrompt,
    createInitialMessages,
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
            products: ['Widget Pro', 'Widget Lite'],
            offers: ['20% off', 'Free trial'],
            qualificationCriteria: 'Budget > $10k',
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
        expect(result).toContain('Various products and services');
        expect(result).toContain('Contact us for current offers');
        expect(result).not.toContain('{{');
    });

    it('handles null industry gracefully', () => {
        const result = buildSystemPrompt('customer-service', {
            companyName: 'Test',
            industry: null,
        });

        expect(result).toContain('General Business');
    });

    it('strips qualification criteria placeholder when not provided', () => {
        const result = buildSystemPrompt('review-generation', {
            companyName: 'Test',
        });

        expect(result).not.toContain('{{qualificationCriteria}}');
        expect(result).not.toContain('Qualification Criteria');
    });

    it('generates different prompts for different profiles', () => {
        const context = { companyName: 'Test' };
        const reactivation = buildSystemPrompt('database-reactivation', context);
        const nurture = buildSystemPrompt('inbound-nurture', context);

        expect(reactivation).not.toBe(nurture);
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
