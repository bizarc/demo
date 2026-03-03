/**
 * RADAR — Contact enrichment (email extraction).
 * Strategy: scrape website → extract mailto/contact emails → Perplexity fallback.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { scrapeWebsite } from './scraper';
import { getOpenRouterClient } from './openrouter';

// ─── Email extraction from scraped HTML ───────────────────────────────────────

/** Extract the best email address from scraped raw text. */
export function extractEmailFromText(text: string): string | null {
    if (!text) return null;

    // Match mailto: links first (most reliable)
    const mailtoMatch = text.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
    if (mailtoMatch?.[1]) return mailtoMatch[1].toLowerCase();

    // Match plain email addresses (not obfuscated)
    const emailPattern = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;
    const allMatches = [...text.matchAll(emailPattern)].map((m) => m[1].toLowerCase());

    if (allMatches.length === 0) return null;

    // Prefer contact/info/hello/support emails over noreply/admin
    const preferred = allMatches.find((e) =>
        /^(contact|info|hello|hi|hey|sales|team|us|support|office|mail|get|inquir|booking)@/.test(e)
    );
    if (preferred) return preferred;

    // Avoid obvious no-reply / example / placeholder addresses
    const filtered = allMatches.filter((e) =>
        !/^(noreply|no-reply|donotreply|admin|webmaster|postmaster|abuse|spam|test|example)@/.test(e) &&
        !/@(example|sentry|localhost|placeholder)/.test(e)
    );

    return filtered[0] || null;
}

// ─── Perplexity email lookup ──────────────────────────────────────────────────

/**
 * Ask Perplexity to find a contact email for a business.
 * Only called when website scrape finds no email.
 */
async function lookupEmailWithAI(
    businessName: string,
    city: string | null,
    websiteUrl: string | null
): Promise<string | null> {
    const client = getOpenRouterClient();

    const context = [businessName, city, websiteUrl].filter(Boolean).join(', ');
    const prompt = `Find the contact email address for this local business: ${context}

Return ONLY the email address (e.g., info@example.com) if you find a real, verified one.
If you cannot find a confirmed email address, return the single word: null

Do not guess or fabricate. Return null if uncertain.`;

    try {
        const raw = await client.chat(
            [{ role: 'user', content: prompt }],
            'perplexity/sonar',
            { maxTokens: 64, temperature: 0.1 }
        );

        const trimmed = raw.trim().toLowerCase();
        if (trimmed === 'null' || trimmed === 'none' || !trimmed.includes('@')) return null;

        // Extract the email from the response
        const match = trimmed.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
        return match?.[1] || null;
    } catch {
        return null;
    }
}

// ─── Main enrichment orchestrator ─────────────────────────────────────────────

/**
 * Attempt to find and save an email for a prospect.
 * Priority: scraped website email → Perplexity lookup → null
 * Returns the email if found, otherwise null.
 */
export async function enrichProspectEmail(
    supabase: SupabaseClient,
    prospectId: string
): Promise<string | null> {
    const { data: prospect, error } = await supabase
        .from('prospects')
        .select('id, email, company_name, website_url, city, state, status')
        .eq('id', prospectId)
        .single();

    if (error || !prospect) throw new Error('Prospect not found');

    // Already has an email — nothing to do
    if (prospect.email) return prospect.email;

    const city = (prospect as any).city || null;

    let foundEmail: string | null = null;

    // Step 1: Scrape website for mailto / contact emails
    if (prospect.website_url) {
        try {
            const scrape = await scrapeWebsite(prospect.website_url, {
                multiPage: true,
                timeout: 8000,
            });
            foundEmail = extractEmailFromText(scrape.rawText);
        } catch {
            // Non-fatal: proceed to AI fallback
        }
    }

    // Step 2: Perplexity AI fallback
    if (!foundEmail) {
        foundEmail = await lookupEmailWithAI(
            prospect.company_name || '',
            city,
            prospect.website_url || null
        );
    }

    if (foundEmail) {
        // Save email and upgrade status from 'new' → 'active'
        const update: Record<string, unknown> = {
            email: foundEmail,
            updated_at: new Date().toISOString(),
        };
        if (prospect.status === 'new') update.status = 'active';

        await supabase
            .from('prospects')
            .update(update)
            .eq('id', prospectId);
    }

    return foundEmail;
}
