import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getOpenRouterClient } from '@/lib/openrouter';

/** Internal scope for LAB/RECON research. No workspace scoping for internal ops. */
const INTERNAL_SCOPE_ID = '00000000-0000-0000-0000-000000000001';
const PERPLEXITY_MODEL = 'perplexity/sonar'; // Cost-effective web-backed research

export interface ResearchRecord {
    id: string;
    workspace_id: string;
    target_id: string | null;
    source: string;
    title: string;
    summary: string;
    competitors: string[];
    market_position: string | null;
    offerings: string[];
    tech_stack: string[];
    evidence: Array<{ label: string; url?: string; snippet?: string }>;
    confidence_score: number | null;
    status: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * POST /api/research
 * Run AI research for a company via Perplexity, store in research_records.
 * Body: { companyName: string; websiteUrl?: string; industry?: string; demoId?: string }
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const body = await request.json().catch(() => ({}));
    const { companyName, websiteUrl, industry, demoId, missionProfile } = body as {
        companyName?: string;
        websiteUrl?: string;
        industry?: string;
        demoId?: string;
        missionProfile?: string;
    };

    const company = typeof companyName === 'string' ? companyName.trim() : '';
    if (!company) {
        return Response.json({ error: 'companyName is required' }, { status: 400 });
    }

    const client = getOpenRouterClient();
    if (!client.isConfigured()) {
        return Response.json({ error: 'OpenRouter API key not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const url = typeof websiteUrl === 'string' ? websiteUrl.trim() : '';
    const ind = typeof industry === 'string' ? industry.trim() : '';

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

    const prompt = `You are a business research assistant. Research the company "${company}"${url ? ` (website: ${url})` : ''}${ind ? ` in the ${ind} industry` : ''}.

Return a JSON object with these exact keys (no other keys):
- "summary": 2-4 sentence company overview
- "competitors": array of strings (competitor names - max 5)
${contextInstructions}

Output ONLY valid JSON, no markdown or extra text.`;

    try {
        const response = await client.chat(
            [{ role: 'user', content: prompt }],
            PERPLEXITY_MODEL,
            { temperature: 0.3, maxTokens: 1024 }
        );

        let parsed: {
            summary?: string;
            competitors?: string[];
            context_block?: string;
        } = {};
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

        const enrichment = {
            summary,
            competitors,
            context_block,
        };

        const { data: record, error } = await supabase
            .from('research_records')
            .insert({
                workspace_id: INTERNAL_SCOPE_ID,
                target_id: demoId || null,
                source: 'perplexity',
                title: `${company} - AI Research`,
                summary: summary || 'No summary generated',
                competitors,
                tech_stack: [],
                evidence: [],
                status: 'draft',
                created_by: authResult.userId,
            })
            .select()
            .single();

        if (error) {
            // Tables may not exist if RECON migration not run; still return enrichment
            if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return Response.json({ record: null, enrichment });
            }
            console.error('Research insert error:', error);
            return Response.json({ error: 'Failed to save research' }, { status: 500 });
        }

        if (demoId && record) {
            await supabase.from('research_links').insert({
                research_id: record.id,
                link_type: 'demo',
                target_id: demoId,
            });
        }

        return Response.json({ record: record as unknown as ResearchRecord, enrichment });
    } catch (err) {
        console.error('Research API error:', err);
        return Response.json(
            { error: err instanceof Error ? err.message : 'Research failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/research
 * List research records for the workspace. Query: ?status=draft|validated|production_approved
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
        .from('research_records')
        .select('*')
        .eq('workspace_id', INTERNAL_SCOPE_ID)
        .order('created_at', { ascending: false })
        .limit(50);

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Research list error:', error);
        return Response.json({ error: 'Failed to list research' }, { status: 500 });
    }

    return Response.json({ records: (data ?? []) as unknown as ResearchRecord[] });
}
