import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getMissionPrompt, MissionContext } from './prompts';

describe('Mission Profile Prompts', () => {
  const baseContext: MissionContext = {
    companyName: 'Acme Corp',
    productsServices: ['Widgets', 'Gadgets'],
    offers: ['50% off first month', 'Free consultation'],
  };

  it('should generate a Reactivation prompt', () => {
    const prompt = getMissionPrompt('reactivation', baseContext);
    assert.match(prompt, /You are an AI assistant for Acme Corp/);
    assert.match(prompt, /reaching out to a past lead/);
    assert.match(prompt, /Products\/Services: Widgets, Gadgets/);
    assert.match(prompt, /Current Offers: 50% off first month, Free consultation/);
  });

  it('should generate an Inbound Nurture prompt with qualification criteria', () => {
    const context: MissionContext = {
      ...baseContext,
      qualificationCriteria: ['Budget > $1000', 'Timeline < 3 months'],
    };
    const prompt = getMissionPrompt('nurture', context);
    assert.match(prompt, /You are an AI assistant for Acme Corp/);
    assert.match(prompt, /handling a new inbound lead/);
    // Escape the $ in the regex
    assert.match(prompt, /Qualification Criteria: Budget > \$1000, Timeline < 3 months/);
  });

  it('should generate an Inbound Nurture prompt without qualification criteria', () => {
    const prompt = getMissionPrompt('nurture', baseContext);
    assert.match(prompt, /Qualification Criteria: None specified/);
  });

  it('should generate a Customer Service prompt with FAQ', () => {
    const context: MissionContext = {
      ...baseContext,
      faq: [
        { question: 'What is your return policy?', answer: '30 days money back.' },
        { question: 'Do you ship internationally?', answer: 'Yes, we do.' },
      ],
    };
    const prompt = getMissionPrompt('service', context);
    assert.match(prompt, /You are a customer service AI assistant for Acme Corp/);
    assert.match(prompt, /Q: What is your return policy\?\s+A: 30 days money back\./);
    assert.match(prompt, /Q: Do you ship internationally\?\s+A: Yes, we do\./);
  });

  it('should generate a Customer Service prompt without FAQ', () => {
    const prompt = getMissionPrompt('service', baseContext);
    assert.match(prompt, /FAQ:\s+None provided/);
  });

  it('should generate a Review Generation prompt', () => {
    const prompt = getMissionPrompt('review', baseContext);
    assert.match(prompt, /You are an AI assistant for Acme Corp/);
    assert.match(prompt, /following up with a customer after a service/);
    assert.match(prompt, /check their satisfaction and request a review/);
  });

  it('should throw an error for unknown profile', () => {
    assert.throws(() => {
      // @ts-ignore
      getMissionPrompt('unknown', baseContext);
    }, /Unknown mission profile: unknown/);
  });
});
