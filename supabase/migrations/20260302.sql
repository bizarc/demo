-- Phase 4.2: RADAR — Prospects table
-- Outbound targets (separate from leads which are inbound demo engagers)

CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    instagram_handle TEXT,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    title TEXT,
    industry TEXT,
    company_size TEXT,
    website_url TEXT,
    location TEXT,
    enriched_at TIMESTAMPTZ,
    enrichment_source TEXT,
    enrichment_data JSONB,
    tags TEXT[] DEFAULT '{}',
    score INTEGER DEFAULT 0,
    score_signals JSONB,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'unsubscribed', 'bounced', 'archived')),
    unsubscribed_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_type TEXT CHECK (bounce_type IN ('hard', 'soft')),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    imported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT prospect_has_contact CHECK (
        email IS NOT NULL
        OR phone IS NOT NULL
        OR linkedin_url IS NOT NULL
        OR instagram_handle IS NOT NULL
    )
);

-- Deduplicate emails (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS prospects_email_unique
    ON prospects (lower(email))
    WHERE email IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_company_name ON prospects(company_name);
CREATE INDEX IF NOT EXISTS idx_prospects_imported_by ON prospects(imported_by);
CREATE INDEX IF NOT EXISTS idx_prospects_lead_id ON prospects(lead_id);

-- Trigger: updated_at auto-update
CREATE OR REPLACE TRIGGER prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- All authenticated users (operator+) can read and write
CREATE POLICY "prospects_select" ON prospects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "prospects_insert" ON prospects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "prospects_update" ON prospects
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Only service role (super_admin) can delete
CREATE POLICY "prospects_delete" ON prospects
    FOR DELETE USING (auth.role() = 'service_role');
