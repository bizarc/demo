-- Phase 4.2: RADAR — Campaign Enrollments table

CREATE TABLE IF NOT EXISTS campaign_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'replied', 'unsubscribed', 'bounced', 'paused')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_send_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    -- Idempotency: timestamp set before send, cleared on error, prevents double-sends
    sending_at TIMESTAMPTZ,
    personalization_context JSONB,
    enrolled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT campaign_enrollments_unique UNIQUE (campaign_id, prospect_id)
);

-- Critical: cron query index — fast lookup of due enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_next_send_at
    ON campaign_enrollments (next_send_at)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_prospect_id ON campaign_enrollments(prospect_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON campaign_enrollments(status);

-- RLS
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select" ON campaign_enrollments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "enrollments_insert" ON campaign_enrollments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "enrollments_update" ON campaign_enrollments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "enrollments_delete" ON campaign_enrollments
    FOR DELETE USING (auth.role() = 'authenticated');
