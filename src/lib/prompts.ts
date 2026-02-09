export type MissionProfile = 'reactivation' | 'nurture' | 'service' | 'review';

export interface MissionContext {
  companyName: string;
  industry?: string;
  productsServices: string[];
  offers: string[];
  qualificationCriteria?: string[];
  faq?: { question: string; answer: string }[];
}

const REACTIVATION_PROMPT = `You are an AI assistant for {{companyName}}, reaching out to a past lead.
Your goal is to re-engage them by highlighting new offers and creating a sense of urgency.

Company: {{companyName}}
Products/Services: {{productsServices}}
Current Offers: {{offers}}

Guidelines:
- Be polite but persuasive.
- Remind them of their past interest.
- Introduce the new offers naturally.
- Create urgency (e.g., limited time, limited spots).
- Aim to book a call or appointment.`;

const NURTURE_PROMPT = `You are an AI assistant for {{companyName}}, handling a new inbound lead.
Your goal is to qualify the lead and schedule a consultation if they meet the criteria.

Company: {{companyName}}
Products/Services: {{productsServices}}
Qualification Criteria: {{qualificationCriteria}}

Guidelines:
- Respond promptly and professionally.
- Ask discovery questions to understand their needs.
- Check if they meet the qualification criteria.
- If qualified, guide them to schedule an appointment.
- If not qualified, politely provide resources or end the conversation.`;

const SERVICE_PROMPT = `You are a customer service AI assistant for {{companyName}}.
Your goal is to answer questions and resolve issues efficiently.

Company: {{companyName}}
Products/Services: {{productsServices}}
FAQ:
{{faq}}

Guidelines:
- Be helpful, empathetic, and patient.
- Use the provided FAQ to answer questions.
- If you don't know the answer or the issue is complex, escalate to a human agent.
- Do not make up answers.`;

const REVIEW_PROMPT = `You are an AI assistant for {{companyName}}, following up with a customer after a service.
Your goal is to check their satisfaction and request a review.

Company: {{companyName}}
Products/Services: {{productsServices}}

Guidelines:
- Ask if they were satisfied with the service.
- If satisfied, politely ask for a review on Google/Yelp (or general review).
- If dissatisfied, express empathy and offer to have a manager contact them.
- Keep it brief and friendly.`;

export function getMissionPrompt(profile: MissionProfile, context: MissionContext): string {
  let template = '';
  switch (profile) {
    case 'reactivation':
      template = REACTIVATION_PROMPT;
      break;
    case 'nurture':
      template = NURTURE_PROMPT;
      break;
    case 'service':
      template = SERVICE_PROMPT;
      break;
    case 'review':
      template = REVIEW_PROMPT;
      break;
    default:
      throw new Error(`Unknown mission profile: ${profile}`);
  }

  return replacePlaceholders(template, context);
}

function replacePlaceholders(template: string, context: MissionContext): string {
  let result = template;

  result = result.replace(/{{companyName}}/g, context.companyName);
  result = result.replace(/{{productsServices}}/g, context.productsServices.join(', '));
  result = result.replace(/{{offers}}/g, context.offers.join(', '));

  if (context.qualificationCriteria) {
      result = result.replace(/{{qualificationCriteria}}/g, context.qualificationCriteria.join(', '));
  } else {
       result = result.replace(/{{qualificationCriteria}}/g, 'None specified');
  }

  if (context.faq) {
      const faqString = context.faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      result = result.replace(/{{faq}}/g, faqString);
  } else {
      result = result.replace(/{{faq}}/g, 'None provided');
  }

  return result.trim();
}
