-- Phase 4.2: RADAR — Campaigns table

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    mission_profile TEXT NOT NULL DEFAULT 'inbound-nurture'
        CHECK (mission_profile IN ('database-reactivation', 'inbound-nurture', 'customer-service', 'review-generation')),
    channel TEXT NOT NULL DEFAULT 'email'
        CHECK (channel IN ('email', 'instagram', 'linkedin')),
    from_name TEXT,
    from_email TEXT,
    reply_to_email TEXT,
    research_record_id UUID REFERENCES research_records(id) ON DELETE SET NULL,
    knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE SET NULL,
    openrouter_model TEXT,
    send_time_hour INTEGER DEFAULT 9 CHECK (send_time_hour >= 0 AND send_time_hour <= 23),
    send_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri'],
    timezone TEXT DEFAULT 'America/New_York',
    daily_send_limit INTEGER NOT NULL DEFAULT 200,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);

-- Trigger: updated_at auto-update
CREATE OR REPLACE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON campaigns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "campaigns_insert" ON campaigns
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "campaigns_update" ON campaigns
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "campaigns_delete" ON campaigns
    FOR DELETE USING (auth.role() = 'service_role');
