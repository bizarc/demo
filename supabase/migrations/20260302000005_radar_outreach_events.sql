-- Phase 4.2: RADAR — Outreach Events append-only event log

CREATE TABLE IF NOT EXISTS outreach_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES campaign_enrollments(id) ON DELETE SET NULL,
    step_number INTEGER,
    event_type TEXT NOT NULL
        CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed', 'converted')),
    channel TEXT NOT NULL DEFAULT 'email',
    message_id TEXT,
    subject TEXT,
    body_preview TEXT,
    tracking_id TEXT UNIQUE,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for open/click pixel tracking
CREATE INDEX IF NOT EXISTS idx_outreach_events_tracking_id
    ON outreach_events (tracking_id)
    WHERE tracking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outreach_events_campaign_id ON outreach_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_prospect_id ON outreach_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_enrollment_id ON outreach_events(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_event_type ON outreach_events(event_type);
CREATE INDEX IF NOT EXISTS idx_outreach_events_occurred_at ON outreach_events(occurred_at DESC);

-- RLS — append-only (no update/delete for log integrity)
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_events_select" ON outreach_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "outreach_events_insert" ON outreach_events
    FOR INSERT WITH CHECK (true);
