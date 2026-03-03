-- Phase 4.2: RADAR — Discovery layer (migration 007)
-- Adds Google Places data to prospects, creates discovery_sessions,
-- adds outreach_goal to campaigns, and relaxes mission_profile constraint.

-- ─── Prospects: add discovery columns ────────────────────────────────────────

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2,1);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS google_review_count INT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS state TEXT;

-- Unique index on google_place_id (partial — only when set)
CREATE UNIQUE INDEX IF NOT EXISTS prospects_google_place_id_unique
    ON prospects(google_place_id) WHERE google_place_id IS NOT NULL;

-- Add 'new' to the status enum (prospects imported without email yet)
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE prospects ADD CONSTRAINT prospects_status_check
    CHECK (status IN ('active', 'new', 'unsubscribed', 'bounced', 'archived'));

-- Relax the contact constraint to also allow website_url or google_place_id
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospect_has_contact;
ALTER TABLE prospects ADD CONSTRAINT prospect_has_contact CHECK (
    email IS NOT NULL
    OR phone IS NOT NULL
    OR linkedin_url IS NOT NULL
    OR instagram_handle IS NOT NULL
    OR website_url IS NOT NULL
    OR google_place_id IS NOT NULL
);

-- ─── Campaigns: drop mission_profile, add outreach_goal ──────────────────────

-- Must drop the view before dropping the column it references
DROP VIEW IF EXISTS campaign_analytics;

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_mission_profile_check;
ALTER TABLE campaigns DROP COLUMN IF EXISTS mission_profile;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS outreach_goal TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_niche TEXT;

-- Recreate campaign_analytics view without mission_profile
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT
    c.id AS campaign_id,
    c.name AS campaign_name,
    c.status AS campaign_status,
    c.channel,
    c.outreach_goal,
    COUNT(DISTINCT e.id) AS total_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) AS active_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) AS completed_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'replied' THEN e.id END) AS replied_enrollments,
    COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) AS total_sent,
    COUNT(CASE WHEN oe.event_type = 'delivered' THEN 1 END) AS total_delivered,
    COUNT(DISTINCT CASE WHEN oe.event_type = 'opened' THEN oe.prospect_id END) AS unique_opens,
    COUNT(CASE WHEN oe.event_type = 'opened' THEN 1 END) AS total_opens,
    COUNT(DISTINCT CASE WHEN oe.event_type = 'clicked' THEN oe.prospect_id END) AS unique_clicks,
    COUNT(CASE WHEN oe.event_type = 'clicked' THEN 1 END) AS total_clicks,
    COUNT(DISTINCT CASE WHEN oe.event_type = 'replied' THEN oe.prospect_id END) AS unique_replies,
    COUNT(CASE WHEN oe.event_type = 'bounced' THEN 1 END) AS total_bounced,
    COUNT(CASE WHEN oe.event_type = 'unsubscribed' THEN 1 END) AS total_unsubscribed,
    COUNT(CASE WHEN oe.event_type = 'converted' THEN 1 END) AS total_converted,
    CASE
        WHEN COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN oe.event_type = 'opened' THEN oe.prospect_id END)::NUMERIC
            / COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) * 100,
            2
        )
        ELSE 0
    END AS open_rate,
    CASE
        WHEN COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN oe.event_type = 'replied' THEN oe.prospect_id END)::NUMERIC
            / COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) * 100,
            2
        )
        ELSE 0
    END AS reply_rate,
    CASE
        WHEN COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN oe.event_type = 'clicked' THEN oe.prospect_id END)::NUMERIC
            / COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) * 100,
            2
        )
        ELSE 0
    END AS click_rate,
    c.created_at,
    c.updated_at
FROM campaigns c
LEFT JOIN campaign_enrollments e ON e.campaign_id = c.id
LEFT JOIN outreach_events oe ON oe.campaign_id = c.id
GROUP BY c.id, c.name, c.status, c.channel, c.outreach_goal, c.created_at, c.updated_at;

-- ─── Discovery sessions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    niche TEXT,
    location TEXT,
    result_count INT DEFAULT 0,
    imported_count INT DEFAULT 0,
    raw_results JSONB,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_sessions_created_by ON discovery_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_created_at ON discovery_sessions(created_at DESC);

ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discovery_sessions_select" ON discovery_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "discovery_sessions_insert" ON discovery_sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "discovery_sessions_update" ON discovery_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "discovery_sessions_delete" ON discovery_sessions
    FOR DELETE USING (auth.role() = 'service_role');
