/**
 * RECON Skill Runtime — execute a skill by key with policy check and audit.
 */

import { createServerClient } from '@/lib/supabase';
import { getOpenRouterClient } from '@/lib/openrouter';
import {
    getSkillByKey,
    isExecutionModeAllowed,
    createSkillRun,
    completeSkillRun,
    type ExecutionMode,
} from './skillCatalog';
import type { ProfileRole } from '@/lib/auth';
import type { SkillCatalogEntry } from '@/lib/database.types';
import { getKbScorecard } from '@/lib/kbScorecard';
import { buildOutreachPrompt } from '@/lib/radarPrompts';

const INTERNAL_SCOPE_ID = '00000000-0000-0000-0000-000000000001';
const PERPLEXITY_MODEL = 'perplexity/sonar';

function skillKeyToResearchType(skillKey: string): 'company' | 'industry' | 'function' | 'technology' | null {
    if (skillKey === 'research.company.profile.v1') return 'company';
    if (skillKey === 'research.industry.landscape.v1') return 'industry';
    if (skillKey === 'research.function.v1') return 'function';
    if (skillKey === 'research.technology.v1') return 'technology';
    if (skillKey === 'research.function_technology.v1') return 'function'; // legacy deprecated skill
    return null;
}

export interface ExecuteSkillInput {
    skillKey: string;
    executionMode: ExecutionMode;
    input: Record<string, unknown>;
    userId: string | null;
    role: ProfileRole;
}

export interface ExecuteSkillResult {
    runId: string;
    status: 'completed' | 'failed';
    outputPayload?: Record<string, unknown>;
    outputAssetId?: string;
    outputAssetType?: 'research_record' | 'knowledge_base' | 'campaign_step' | 'outreach_draft';
    lifecycleState: 'draft';
    errorMessage?: string;
}

/**
 * Execute a skill: policy check, create run, dispatch by family, complete run with audit.
 */
export async function executeSkill(params: ExecuteSkillInput): Promise<ExecuteSkillResult> {
    const { skillKey, executionMode, input, userId, role } = params;

    const skill = await getSkillByKey(skillKey);
    if (!skill) {
        throw new Error(`Skill not found: ${skillKey}`);
    }

    const policy = isExecutionModeAllowed(skill, executionMode, role);
    if (!policy.allowed) {
        throw new Error(policy.reason ?? 'Execution mode not allowed');
    }

    const { id: runId } = await createSkillRun(
        skill.id,
        skill.skill_key,
        executionMode,
        input,
        userId
    );

    try {
        if (skill.skill_family === 'research') {
            const result = await executeResearchSkill(skill, input, userId);
            await completeSkillRun(runId, {
                status: 'completed',
                output_payload: result.payload,
                output_asset_id: result.recordId ?? undefined,
                output_asset_type: result.recordId ? 'research_record' : undefined,
                lifecycle_state: 'draft',
            });
            return {
                runId,
                status: 'completed',
                outputPayload: result.payload,
                outputAssetId: result.recordId,
                outputAssetType: result.recordId ? 'research_record' : undefined,
                lifecycleState: 'draft',
            };
        }

        if (skill.skill_family === 'knowledge_base') {
            const result = await executeKbSkill(skill, input);
            await completeSkillRun(runId, {
                status: result.status,
                output_payload: result.payload,
                error_message: result.errorMessage,
                lifecycle_state: 'draft',
            });
            return {
                runId,
                status: result.status,
                outputPayload: result.payload,
                lifecycleState: 'draft',
                errorMessage: result.errorMessage,
            };
        }

        if (skill.skill_family === 'outreach') {
            const result = await executeOutreachSkill(skill, input);
            await completeSkillRun(runId, {
                status: result.status,
                output_payload: result.payload,
                error_message: result.errorMessage,
                lifecycle_state: 'draft',
            });
            return {
                runId,
                status: result.status,
                outputPayload: result.payload,
                lifecycleState: 'draft',
                errorMessage: result.errorMessage,
            };
        }

        await completeSkillRun(runId, {
            status: 'failed',
            error_message: `Unknown skill family: ${skill.skill_family}`,
            lifecycle_state: 'draft',
        });
        return {
            runId,
            status: 'failed',
            lifecycleState: 'draft',
            errorMessage: `Unknown skill family: ${skill.skill_family}`,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Skill execution failed';
        await completeSkillRun(runId, {
            status: 'failed',
            error_message: message,
            lifecycle_state: 'draft',
        });
        return {
            runId,
            status: 'failed',
            lifecycleState: 'draft',
            errorMessage: message,
        };
    }
}

/** Outreach skill: generate email (or LinkedIn) copy via buildOutreachPrompt + LLM */
async function executeOutreachSkill(
    skill: SkillCatalogEntry,
    input: Record<string, unknown>
): Promise<{ status: 'completed' | 'failed'; payload?: Record<string, unknown>; errorMessage?: string }> {
    const client = getOpenRouterClient();
    if (!client.isConfigured()) {
        return { status: 'failed', errorMessage: 'OpenRouter API key not configured' };
    }

    if (skill.skill_key === 'outreach.linkedin.message.v1') {
        return executeLinkedInOutreachSkill(skill, input, client);
    }

    if (skill.skill_key !== 'outreach.prospecting.email.v1') {
        return { status: 'failed', errorMessage: `Outreach skill not implemented: ${skill.skill_key}` };
    }
    const ctx = {
        outreachGoal: typeof input.outreach_goal === 'string' ? input.outreach_goal : undefined,
        targetNiche: typeof input.target_niche === 'string' ? input.target_niche : (typeof input.industry === 'string' ? input.industry : undefined),
        firstName: typeof input.first_name === 'string' ? input.first_name : undefined,
        lastName: typeof input.last_name === 'string' ? input.last_name : undefined,
        companyName: typeof input.company_name === 'string' ? input.company_name : undefined,
        title: typeof input.title === 'string' ? input.title : undefined,
        industry: typeof input.industry === 'string' ? input.industry : undefined,
        senderName: typeof input.sender_name === 'string' ? input.sender_name : undefined,
        researchSummary: typeof input.research_summary === 'string' ? input.research_summary : undefined,
        knowledgeBaseId: typeof input.knowledge_base_id === 'string' ? input.knowledge_base_id : undefined,
        aiInstructions: typeof input.ai_instructions === 'string' ? input.ai_instructions : undefined,
        stepNumber: typeof input.step_number === 'number' ? input.step_number : 1,
        unsubscribeUrl: typeof input.unsubscribe_url === 'string' ? input.unsubscribe_url : '{{unsubscribe_url}}',
    };
    const systemPrompt = await buildOutreachPrompt(ctx);
    const model = (skill.config_defaults as { model?: string })?.model ?? 'openai/gpt-4o-mini';
    const raw = await client.chat(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Generate the outreach email. Return only the JSON object with subject and body.' }],
        model,
        { maxTokens: 1024, temperature: 0.7 }
    );
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return { status: 'failed', errorMessage: 'Model did not return valid JSON' };
    }
    let parsed: { subject?: string; body?: string };
    try {
        parsed = JSON.parse(jsonMatch[0]) as { subject?: string; body?: string };
    } catch {
        return { status: 'failed', errorMessage: 'Failed to parse model JSON' };
    }
    const subject = typeof parsed.subject === 'string' ? parsed.subject : '(No subject)';
    const body = typeof parsed.body === 'string' ? parsed.body : '';
    return {
        status: 'completed',
        payload: { subject, body, channel: 'email' },
    };
}

async function executeLinkedInOutreachSkill(
    skill: SkillCatalogEntry,
    input: Record<string, unknown>,
    client: ReturnType<typeof getOpenRouterClient>
): Promise<{ status: 'completed' | 'failed'; payload?: Record<string, unknown>; errorMessage?: string }> {
    const company = typeof input.company_name === 'string' ? input.company_name : 'their company';
    const firstName = typeof input.first_name === 'string' ? input.first_name : '';
    const goal = typeof input.outreach_goal === 'string' ? input.outreach_goal : 'connect and start a conversation';
    const researchSummary = typeof input.research_summary === 'string' ? input.research_summary : '';
    const model = (skill.config_defaults as { model?: string })?.model ?? 'openai/gpt-4o-mini';
    const prompt = `You are writing a LinkedIn connection request or short InMail. Recipient: ${firstName || 'Prospect'}, Company: ${company}.
Goal: ${goal}
${researchSummary ? `Research context:\n${researchSummary}\n` : ''}
Constraints: Keep under 300 characters for connection requests. Professional, specific, one clear CTA. No generic flattery.
Return ONLY a JSON object: { "message": "<your LinkedIn message text>" }`;
    const raw = await client.chat(
        [{ role: 'user', content: prompt }],
        model,
        { maxTokens: 256, temperature: 0.6 }
    );
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { status: 'failed', errorMessage: 'Model did not return valid JSON' };
    try {
        const parsed = JSON.parse(jsonMatch[0]) as { message?: string };
        const message = typeof parsed.message === 'string' ? parsed.message : raw;
        return { status: 'completed', payload: { message, channel: 'linkedin' } };
    } catch {
        return { status: 'failed', errorMessage: 'Failed to parse model JSON' };
    }
}

/** KB skill: quality scorecard (no asset created; output is the scorecard payload) */
async function executeKbSkill(
    skill: SkillCatalogEntry,
    input: Record<string, unknown>
): Promise<{ status: 'completed' | 'failed'; payload?: Record<string, unknown>; errorMessage?: string }> {
    const kbId = typeof input.kb_id === 'string' ? input.kb_id.trim() : '';
    if (!kbId) {
        return { status: 'failed', errorMessage: 'kb_id is required for knowledge base skills' };
    }
    const scorecard = await getKbScorecard(kbId);
    if (!scorecard) {
        return { status: 'failed', errorMessage: 'Knowledge base not found' };
    }
    return {
        status: 'completed',
        payload: scorecard as unknown as Record<string, unknown>,
    };
}

/** Research skill: Perplexity + research_records insert by research type */
async function executeResearchSkill(
    skill: SkillCatalogEntry,
    input: Record<string, unknown>,
    createdBy: string | null
): Promise<{ payload: Record<string, unknown>; recordId?: string }> {
    const companyName = typeof input.companyName === 'string' ? input.companyName.trim() : '';
    const websiteUrl = typeof input.websiteUrl === 'string' ? input.websiteUrl.trim() : '';
    const industry = typeof input.industry === 'string' ? input.industry.trim() : '';
    const demoId = typeof input.demoId === 'string' ? input.demoId : undefined;
    const missionProfile = typeof input.missionProfile === 'string' ? input.missionProfile : undefined;

    const targetName = companyName || (typeof input.target === 'string' ? input.target.trim() : '');
    if (!targetName) {
        throw new Error('Research input must include companyName or target');
    }

    const client = getOpenRouterClient();
    if (!client.isConfigured()) {
        throw new Error('OpenRouter API key not configured');
    }

    const { prompt, titleSuffix } = buildResearchPrompt(skill.skill_key, {
        target: targetName,
        websiteUrl,
        industry,
        missionProfile,
    });

    const response = await client.chat(
        [{ role: 'user', content: prompt }],
        PERPLEXITY_MODEL,
        { temperature: 0.3, maxTokens: 1024 }
    );

    let parsed: { summary?: string; competitors?: string[]; context_block?: string; [k: string]: unknown } = {};
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            parsed = JSON.parse(jsonMatch[0]) as typeof parsed;
        } catch {
            parsed = { summary: response };
        }
    } else {
        parsed = { summary: response };
    }

    const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
    const competitors = Array.isArray(parsed.competitors) ? parsed.competitors : [];
    const context_block = typeof parsed.context_block === 'string' ? parsed.context_block : '';

    const payload = {
        summary,
        competitors,
        context_block,
        raw: parsed,
    };

    const supabase = createServerClient();
    const researchType = skillKeyToResearchType(skill.skill_key);
    const { data: record, error } = await supabase
        .from('research_records')
        .insert({
            workspace_id: INTERNAL_SCOPE_ID,
            target_id: demoId || null,
            source: 'perplexity',
            title: `${targetName} - ${titleSuffix}`,
            summary: summary || 'No summary generated',
            competitors,
            tech_stack: [],
            evidence: [],
            status: 'draft',
            created_by: createdBy ?? undefined,
            research_type: researchType ?? undefined,
            skill_key: skill.skill_key,
        } as never)
        .select('id')
        .single();

    if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            return { payload, recordId: undefined };
        }
        throw error;
    }

    const recordId = record ? (record as { id: string }).id : undefined;
    if (demoId && recordId) {
        await supabase.from('research_links').insert({
            research_id: recordId,
            link_type: 'demo',
            target_id: demoId,
        } as never);
    }

    return { payload, recordId };
}

function buildResearchPrompt(
    skillKey: string,
    opts: { target: string; websiteUrl: string; industry: string; missionProfile?: string }
): { prompt: string; titleSuffix: string } {
    const { target, websiteUrl, industry, missionProfile } = opts;
    const url = websiteUrl ? ` (website: ${websiteUrl})` : '';
    const ind = industry ? ` in the ${industry} industry` : '';

    let contextInstructions = `- "context_block": 2-3 paragraphs describing the company's offerings and target audience`;
    if (missionProfile === 'database-reactivation') {
        contextInstructions = `- "context_block": describe offerings to re-pitch, win-back deals/incentives for returning customers, and signals of a good reactivation candidate`;
    } else if (missionProfile === 'inbound-nurture') {
        contextInstructions = `- "context_block": describe core products/services, trial/demo offers, and key qualification questions (budget, timeline, authority)`;
    } else if (missionProfile === 'customer-service') {
        contextInstructions = `- "context_block": describe services supported, common customer issues, and standard escalation policies`;
    } else if (missionProfile === 'review-generation') {
        contextInstructions = `- "context_block": describe the typical service delivered, review incentives (if any seen), and target audience for feedback`;
    }

    if (skillKey === 'research.company.profile.v1') {
        return {
            titleSuffix: 'Company Intelligence',
            prompt: `You are a business research assistant. Research the company "${target}"${url}${ind}.

Return a JSON object with these exact keys (no other keys):
- "summary": 2-4 sentence company overview
- "competitors": array of strings (competitor names - max 5)
${contextInstructions}

Output ONLY valid JSON, no markdown or extra text.`,
        };
    }

    if (skillKey === 'research.industry.landscape.v1') {
        return {
            titleSuffix: 'Industry Intelligence',
            prompt: `You are a market research assistant. Research the industry or vertical: "${target}"${ind || ''}.

Return a JSON object with these exact keys (no other keys):
- "summary": 2-4 sentence overview of the industry, key trends, and buyer dynamics
- "competitors": array of strings (representative players or segments - max 5)
- "context_block": 2-3 paragraphs on market trends, typical buying triggers, common objections, and compliance or regulatory notes relevant to marketing and sales in this vertical

Output ONLY valid JSON, no markdown or extra text.`,
        };
    }

    if (skillKey === 'research.function.v1') {
        return {
            titleSuffix: 'Function Intelligence',
            prompt: `You are a process and domain research assistant. Research the business function or domain: "${target}"${ind ? ` in the ${industry} context` : ''}.

Return a JSON object with these exact keys (no other keys):
- "summary": 2-4 sentence overview of the function/domain and typical responsibilities and practices
- "competitors": array of strings (alternative roles, methodologies, or comparable functions - max 5)
- "context_block": 2-3 paragraphs on best practices, typical SOPs, escalation and handoff norms, language and compliance considerations (e.g. Customer Service, Finance, Sales, HR)

Output ONLY valid JSON, no markdown or extra text.`,
        };
    }

    if (skillKey === 'research.technology.v1') {
        return {
            titleSuffix: 'Technology Intelligence',
            prompt: `You are a technology and platform research assistant. Research the platform, product, or tool: "${target}"${ind ? ` in the ${industry} context` : ''}.

Return a JSON object with these exact keys (no other keys):
- "summary": 2-4 sentence overview of the technology, main use cases, and typical adoption
- "competitors": array of strings (alternative platforms or tools - max 5)
- "context_block": 2-3 paragraphs on capabilities, common troubleshooting, integration patterns, and maturity or adoption best practices (e.g. ServiceNow, Workday, Salesforce, HubSpot)

Output ONLY valid JSON, no markdown or extra text.`,
        };
    }

    if (skillKey === 'research.function_technology.v1') {
        return {
            titleSuffix: 'Function Intelligence (legacy)',
            prompt: `You are a process and domain research assistant. Research the business function or domain: "${target}"${ind ? ` in the ${industry} context` : ''}.

Return a JSON object with these exact keys (no other keys):
- "summary": 2-4 sentence overview of the function/domain and typical practices
- "competitors": array of strings (alternative roles, methodologies, or tools - max 5)
- "context_block": 2-3 paragraphs on best practices, SOPs, escalation norms, and troubleshooting considerations

Output ONLY valid JSON, no markdown or extra text.`,
        };
    }

    return {
        titleSuffix: 'AI Research',
        prompt: `You are a business research assistant. Research: "${target}"${url}${ind}.

Return a JSON object with these exact keys (no other keys):
- "summary": 2-4 sentence overview
- "competitors": array of strings (max 5)
${contextInstructions}

Output ONLY valid JSON, no markdown or extra text.`,
    };
}
