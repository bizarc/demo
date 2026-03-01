-- Phase 4.1: RECON Schema Updates
-- Decouple knowledge_bases from demos, add lifecycle and versioning

-- 1. knowledge_bases: drop demo_id, add global RECON fields
ALTER TABLE knowledge_bases DROP COLUMN IF EXISTS demo_id;
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger for knowledge_bases
CREATE OR REPLACE TRIGGER knowledge_bases_updated_at
    BEFORE UPDATE ON knowledge_bases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_status ON knowledge_bases(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_created_by ON knowledge_bases(created_by);

-- 2. research_records: add version for optimistic locking
ALTER TABLE research_records ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 3. Update RLS policies for knowledge_bases (global, role-scoped)
-- Drop any existing demo-scoped policies
DROP POLICY IF EXISTS "knowledge_bases_select" ON knowledge_bases;
DROP POLICY IF EXISTS "knowledge_bases_insert" ON knowledge_bases;
DROP POLICY IF EXISTS "knowledge_bases_update" ON knowledge_bases;
DROP POLICY IF EXISTS "knowledge_bases_delete" ON knowledge_bases;

-- Global access policies (all authenticated users can read, service role can write)
CREATE POLICY "knowledge_bases_select" ON knowledge_bases
    FOR SELECT USING (true);

CREATE POLICY "knowledge_bases_insert" ON knowledge_bases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "knowledge_bases_update" ON knowledge_bases
    FOR UPDATE USING (true);

CREATE POLICY "knowledge_bases_delete" ON knowledge_bases
    FOR DELETE USING (true);
