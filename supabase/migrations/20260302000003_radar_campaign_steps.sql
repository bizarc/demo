-- Phase 4.2: RADAR — Campaign Steps table

CREATE TABLE IF NOT EXISTS campaign_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    name TEXT,
    subject_template TEXT,
    body_template TEXT,
    delay_days INTEGER NOT NULL DEFAULT 0,
    use_ai BOOLEAN NOT NULL DEFAULT true,
    ai_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT campaign_steps_unique_number UNIQUE (campaign_id, step_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON campaign_steps(campaign_id);

-- Trigger: updated_at auto-update
CREATE OR REPLACE TRIGGER campaign_steps_updated_at
    BEFORE UPDATE ON campaign_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE campaign_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_steps_select" ON campaign_steps
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "campaign_steps_insert" ON campaign_steps
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "campaign_steps_update" ON campaign_steps
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "campaign_steps_delete" ON campaign_steps
    FOR DELETE USING (auth.role() = 'authenticated');
