/**
 * RADAR core service.
 * Handles prospect enrichment, enrollment, cron-based sending, and analytics.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getOpenRouterClient } from './openrouter';
import {
    buildOutreachPrompt,
    buildTrackingPixelHtml,
    injectTrackingLinks,
    generateTrackingId,
    generateUnsubscribeToken,
    applyTemplateVariables,
} from './radarPrompts';
import { sendOutreachEmail } from './radarSendgrid';

const APP_URL = process.env.RADAR_UNSUBSCRIBE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const CRON_BATCH_SIZE = 100;

// ─── Enrichment ──────────────────────────────────────────────────────────────

/** Enrich a prospect using Perplexity via OpenRouter */
export async function enrichProspect(supabase: SupabaseClient, prospectId: string): Promise<void> {
    const { data: prospect, error } = await supabase
        .from('prospects')
        .select('id, first_name, last_name, company_name, title, industry, website_url, email')
        .eq('id', prospectId)
        .single();

    if (error || !prospect) throw new Error('Prospect not found');

    const query = [
        prospect.company_name,
        prospect.title,
        prospect.first_name && prospect.last_name ? `${prospect.first_name} ${prospect.last_name}` : null,
        prospect.industry,
    ].filter(Boolean).join(', ');

    const client = getOpenRouterClient();
    const enrichmentText = await client.chat(
        [
            {
                role: 'system',
                content: 'You are a B2B research assistant. Return concise JSON enrichment data for the given company/person.',
            },
            {
                role: 'user',
                content: `Research this prospect and return a JSON object with fields: industry, company_size, recent_news, pain_points, tech_stack, social_presence. Query: ${query}`,
            },
        ],
        'perplexity/sonar-small-online',
        { maxTokens: 512, temperature: 0.3 }
    );

    let enrichmentData: Record<string, unknown> = {};
    try {
        const jsonMatch = enrichmentText.match(/\{[\s\S]*\}/);
        if (jsonMatch) enrichmentData = JSON.parse(jsonMatch[0]);
    } catch {
        enrichmentData = { raw: enrichmentText };
    }

    await supabase
        .from('prospects')
        .update({
            enrichment_data: enrichmentData,
            enrichment_source: 'perplexity',
            enriched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', prospectId);
}

// ─── Enrollment ──────────────────────────────────────────────────────────────

/** Enroll a batch of prospects into a campaign */
export async function enrollProspects(
    supabase: SupabaseClient,
    campaignId: string,
    prospectIds: string[],
    enrolledBy: string
): Promise<{ enrolled: number; skipped: number }> {
    // Validate campaign is active
    const { data: campaign, error: camErr } = await supabase
        .from('campaigns')
        .select('id, status, research_record_id')
        .eq('id', campaignId)
        .single();

    if (camErr || !campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'active') throw new Error('Campaign must be active to enroll prospects');

    // Load first step delay
    const { data: firstStep } = await supabase
        .from('campaign_steps')
        .select('delay_days')
        .eq('campaign_id', campaignId)
        .order('step_number', { ascending: true })
        .limit(1)
        .single();

    const delayDays = firstStep?.delay_days ?? 0;
    const nextSendAt = new Date();
    nextSendAt.setDate(nextSendAt.getDate() + delayDays);

    // Load research for personalization context
    let researchSummary: string | null = null;
    if (campaign.research_record_id) {
        const { data: research } = await supabase
            .from('research_records')
            .select('summary, company_name')
            .eq('id', campaign.research_record_id)
            .single();
        researchSummary = research?.summary || null;
    }

    // Filter out unsubscribed/bounced prospects
    const { data: prospects } = await supabase
        .from('prospects')
        .select('id, status, first_name, last_name, company_name, title, industry')
        .in('id', prospectIds)
        .in('status', ['active']);

    const eligible = prospects || [];
    let enrolled = 0;

    for (const prospect of eligible) {
        try {
            const personalizationContext = {
                firstName: prospect.first_name,
                lastName: prospect.last_name,
                companyName: prospect.company_name,
                title: prospect.title,
                industry: prospect.industry,
                researchSummary,
            };

            const { error } = await supabase.from('campaign_enrollments').insert({
                campaign_id: campaignId,
                prospect_id: prospect.id,
                current_step: 1,
                status: 'active',
                next_send_at: nextSendAt.toISOString(),
                personalization_context: personalizationContext,
                enrolled_by: enrolledBy,
            });

            if (!error) enrolled++;
        } catch {
            // Skip duplicates (UNIQUE constraint violation)
        }
    }

    return { enrolled, skipped: prospectIds.length - enrolled };
}

// ─── Cron: Process Due Enrollments ───────────────────────────────────────────

export interface CronResult {
    processed: number;
    sent: number;
    errors: number;
    skipped: number;
}

/** Main cron handler: find and process due enrollments */
export async function processDueEnrollments(supabase: SupabaseClient): Promise<CronResult> {
    const result: CronResult = { processed: 0, sent: 0, errors: 0, skipped: 0 };

    // Claim a batch of due enrollments atomically using sending_at as a lock
    const now = new Date().toISOString();

    const { data: enrollments } = await supabase
        .from('campaign_enrollments')
        .select(`
            id,
            campaign_id,
            prospect_id,
            current_step,
            personalization_context,
            campaigns (
                id, name, from_name, from_email, reply_to_email,
                outreach_goal, target_niche, openrouter_model, daily_send_limit,
                knowledge_base_id, status
            ),
            prospects (
                id, email, first_name, last_name, company_name, title, industry, status
            )
        `)
        .eq('status', 'active')
        .lte('next_send_at', now)
        .is('sending_at', null)
        .limit(CRON_BATCH_SIZE)
        .order('next_send_at', { ascending: true });

    if (!enrollments || enrollments.length === 0) return result;

    // Per-campaign send count tracking (enforce daily_send_limit)
    const campaignSentToday: Record<string, number> = {};

    for (const enrollment of enrollments) {
        result.processed++;
        const campaign = enrollment.campaigns as any;
        const prospect = enrollment.prospects as any;

        // Skip if campaign or prospect is invalid
        if (!campaign || !prospect || campaign.status !== 'active') {
            result.skipped++;
            continue;
        }

        if (!prospect.email) {
            result.skipped++;
            continue;
        }

        // Check daily limit
        if (!campaignSentToday[campaign.id]) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const { count } = await supabase
                .from('outreach_events')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .eq('event_type', 'sent')
                .gte('occurred_at', todayStart.toISOString());
            campaignSentToday[campaign.id] = count || 0;
        }

        if (campaignSentToday[campaign.id] >= (campaign.daily_send_limit || 200)) {
            result.skipped++;
            continue;
        }

        // Lock enrollment to prevent double-sends
        const { error: lockErr } = await supabase
            .from('campaign_enrollments')
            .update({ sending_at: now })
            .eq('id', enrollment.id)
            .is('sending_at', null);

        if (lockErr) {
            result.skipped++;
            continue;
        }

        try {
            // Load the current step
            const { data: step } = await supabase
                .from('campaign_steps')
                .select('*')
                .eq('campaign_id', campaign.id)
                .eq('step_number', enrollment.current_step)
                .single();

            if (!step) {
                // No more steps — complete enrollment
                await supabase
                    .from('campaign_enrollments')
                    .update({ status: 'completed', completed_at: now, sending_at: null })
                    .eq('id', enrollment.id);
                result.skipped++;
                continue;
            }

            // Look up previous message for threading
            const { data: prevEvent } = await supabase
                .from('outreach_events')
                .select('message_id')
                .eq('enrollment_id', enrollment.id)
                .eq('event_type', 'sent')
                .order('occurred_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            const ctx = enrollment.personalization_context as any || {};
            const trackingId = generateTrackingId();

            // Build unsubscribe URL
            const unsubToken = await generateUnsubscribeToken(prospect.id, enrollment.id);
            const unsubUrl = `${APP_URL}/api/radar/track/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

            // Generate content
            let subject: string;
            let htmlBody: string;

            if (step.use_ai) {
                const systemPrompt = await buildOutreachPrompt({
                    outreachGoal: campaign.outreach_goal,
                    targetNiche: campaign.target_niche,
                    firstName: prospect.first_name || ctx.firstName,
                    lastName: prospect.last_name || ctx.lastName,
                    companyName: prospect.company_name || ctx.companyName,
                    title: prospect.title || ctx.title,
                    industry: prospect.industry || ctx.industry,
                    senderName: campaign.from_name,
                    researchSummary: ctx.researchSummary,
                    knowledgeBaseId: campaign.knowledge_base_id,
                    aiInstructions: step.ai_instructions,
                    stepNumber: step.step_number,
                    unsubscribeUrl: unsubUrl,
                });

                const client = getOpenRouterClient();
                const raw = await client.chat(
                    [{ role: 'system', content: systemPrompt }],
                    campaign.openrouter_model || DEFAULT_MODEL,
                    { maxTokens: 1024, temperature: 0.7 }
                );

                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    subject = parsed.subject || '(no subject)';
                    htmlBody = parsed.body || raw;
                } else {
                    subject = step.subject_template || '(no subject)';
                    htmlBody = raw;
                }
            } else {
                // Fixed template — just apply variables
                subject = applyTemplateVariables(step.subject_template || '', {
                    firstName: prospect.first_name,
                    lastName: prospect.last_name,
                    companyName: prospect.company_name,
                    title: prospect.title,
                    senderName: campaign.from_name,
                    unsubscribeUrl: unsubUrl,
                });
                htmlBody = applyTemplateVariables(step.body_template || '', {
                    firstName: prospect.first_name,
                    lastName: prospect.last_name,
                    companyName: prospect.company_name,
                    title: prospect.title,
                    senderName: campaign.from_name,
                    unsubscribeUrl: unsubUrl,
                });
            }

            // Inject tracking pixel and links
            const pixel = buildTrackingPixelHtml(trackingId, APP_URL);
            htmlBody = injectTrackingLinks(htmlBody + pixel, trackingId, APP_URL);

            // Send
            const { messageId } = await sendOutreachEmail({
                to: prospect.email,
                fromName: campaign.from_name || campaign.name,
                fromEmail: campaign.from_email,
                replyTo: campaign.reply_to_email || campaign.from_email,
                subject,
                htmlBody,
                campaignId: campaign.id,
                enrollmentId: enrollment.id,
                trackingId,
                inReplyTo: prevEvent?.message_id || undefined,
                references: prevEvent?.message_id || undefined,
                unsubscribeUrl: unsubUrl,
            });

            // Log sent event
            await supabase.from('outreach_events').insert({
                campaign_id: campaign.id,
                prospect_id: prospect.id,
                enrollment_id: enrollment.id,
                step_number: step.step_number,
                event_type: 'sent',
                channel: 'email',
                message_id: messageId,
                subject,
                body_preview: htmlBody.replace(/<[^>]+>/g, '').slice(0, 200),
                tracking_id: trackingId,
            });

            campaignSentToday[campaign.id] = (campaignSentToday[campaign.id] || 0) + 1;

            // Advance to next step or complete
            const { data: nextStep } = await supabase
                .from('campaign_steps')
                .select('step_number, delay_days')
                .eq('campaign_id', campaign.id)
                .eq('step_number', enrollment.current_step + 1)
                .maybeSingle();

            if (nextStep) {
                const nextSend = new Date();
                nextSend.setDate(nextSend.getDate() + (nextStep.delay_days || 1));
                await supabase
                    .from('campaign_enrollments')
                    .update({
                        current_step: nextStep.step_number,
                        next_send_at: nextSend.toISOString(),
                        sending_at: null,
                    })
                    .eq('id', enrollment.id);
            } else {
                await supabase
                    .from('campaign_enrollments')
                    .update({ status: 'completed', completed_at: now, sending_at: null })
                    .eq('id', enrollment.id);
            }

            result.sent++;
        } catch (err) {
            console.error(`RADAR send error for enrollment ${enrollment.id}:`, err);
            // Release lock on error
            await supabase
                .from('campaign_enrollments')
                .update({ sending_at: null })
                .eq('id', enrollment.id);
            result.errors++;
        }
    }

    return result;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

/** Get analytics for a specific campaign */
export async function getCampaignAnalytics(supabase: SupabaseClient, campaignId: string) {
    const { data: overview, error } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

    if (error) throw new Error('Failed to load campaign analytics');

    // Per-step breakdown
    const { data: steps } = await supabase
        .from('outreach_events')
        .select('step_number, event_type')
        .eq('campaign_id', campaignId);

    const stepBreakdown: Record<number, Record<string, number>> = {};
    for (const event of steps || []) {
        const sn = event.step_number ?? 0;
        if (!stepBreakdown[sn]) stepBreakdown[sn] = {};
        stepBreakdown[sn][event.event_type] = (stepBreakdown[sn][event.event_type] || 0) + 1;
    }

    // Sends per day (last 30 days)
    const { data: dailySends } = await supabase
        .from('outreach_events')
        .select('occurred_at')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'sent')
        .gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('occurred_at', { ascending: true });

    const sendsByDay: Record<string, number> = {};
    for (const event of dailySends || []) {
        const day = event.occurred_at.slice(0, 10);
        sendsByDay[day] = (sendsByDay[day] || 0) + 1;
    }

    return { overview, stepBreakdown, sendsByDay };
}

/** Get aggregate analytics across all campaigns */
export async function getAggregateAnalytics(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from('campaign_analytics')
        .select('*')
        .order('total_sent', { ascending: false });

    if (error) throw new Error('Failed to load aggregate analytics');

    const totals = (data || []).reduce(
        (acc, row) => ({
            totalCampaigns: acc.totalCampaigns + 1,
            activeCampaigns: acc.activeCampaigns + (row.campaign_status === 'active' ? 1 : 0),
            totalSent: acc.totalSent + (row.total_sent || 0),
            totalOpens: acc.totalOpens + (row.unique_opens || 0),
            totalReplies: acc.totalReplies + (row.unique_replies || 0),
        }),
        { totalCampaigns: 0, activeCampaigns: 0, totalSent: 0, totalOpens: 0, totalReplies: 0 }
    );

    const avgOpenRate =
        totals.totalSent > 0
            ? Math.round((totals.totalOpens / totals.totalSent) * 10000) / 100
            : 0;

    return { campaigns: data || [], totals, avgOpenRate };
}
