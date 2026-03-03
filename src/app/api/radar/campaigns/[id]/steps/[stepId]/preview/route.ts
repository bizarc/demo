import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getClientIp, checkRateLimit, RADAR_LIMIT } from '@/lib/rateLimit';
import { buildOutreachPrompt, applyTemplateVariables, generateTrackingId } from '@/lib/radarPrompts';
import { getOpenRouterClient } from '@/lib/openrouter';

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** POST /api/radar/campaigns/[id]/steps/[stepId]/preview — Preview generated email for a prospect */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; stepId: string } }
) {
    const { id, stepId } = params;
    if (!isValidUUID(id) || !isValidUUID(stepId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`radar:${ip}`, RADAR_LIMIT);
        if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

        const body = await request.json();
        const { prospect_id } = body;
        if (!prospect_id || !isValidUUID(prospect_id)) {
            return NextResponse.json({ error: 'prospect_id required' }, { status: 400 });
        }

        const supabase = createServerClient();

        const [{ data: step }, { data: campaign }, { data: prospect }] = await Promise.all([
            supabase.from('campaign_steps').select('*').eq('id', stepId).eq('campaign_id', id).single(),
            supabase.from('campaigns').select('*').eq('id', id).single(),
            supabase.from('prospects').select('*').eq('id', prospect_id).single(),
        ]);

        if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

        const unsubUrl = '#unsubscribe-preview';
        const model = campaign.openrouter_model || 'openai/gpt-4o-mini';

        let subject: string;
        let body_html: string;

        if (step.use_ai) {
            const systemPrompt = await buildOutreachPrompt({
                outreachGoal: campaign.outreach_goal,
                targetNiche: campaign.target_niche,
                firstName: prospect.first_name,
                lastName: prospect.last_name,
                companyName: prospect.company_name,
                title: prospect.title,
                industry: prospect.industry,
                senderName: campaign.from_name,
                knowledgeBaseId: campaign.knowledge_base_id,
                aiInstructions: step.ai_instructions,
                stepNumber: step.step_number,
                unsubscribeUrl: unsubUrl,
            });

            const client = getOpenRouterClient();
            const raw = await client.chat(
                [{ role: 'system', content: systemPrompt }],
                model,
                { maxTokens: 1024, temperature: 0.7 }
            );

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                subject = parsed.subject || '(preview)';
                body_html = parsed.body || raw;
            } else {
                subject = step.subject_template || '(preview)';
                body_html = raw;
            }
        } else {
            const vars = {
                firstName: prospect.first_name,
                lastName: prospect.last_name,
                companyName: prospect.company_name,
                title: prospect.title,
                senderName: campaign.from_name,
                unsubscribeUrl: unsubUrl,
            };
            subject = applyTemplateVariables(step.subject_template || '', vars);
            body_html = applyTemplateVariables(step.body_template || '', vars);
        }

        return NextResponse.json({ subject, body: body_html, model_used: model });
    } catch (err) {
        console.error('Step preview error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
