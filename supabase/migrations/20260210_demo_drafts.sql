-- Migration: Add draft support to demos table
-- Adds status, created_by, updated_at, deleted_at, current_step
-- Relaxes NOT NULL constraints to allow partial saves for drafts

-- 1. Add new columns
ALTER TABLE demos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE demos ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE demos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE demos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE demos ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'mission';

-- 2. Add CHECK constraint for status
ALTER TABLE demos ADD CONSTRAINT demos_status_check
  CHECK (status IN ('draft', 'active', 'expired', 'blueprint'));

-- 3. Relax NOT NULL constraints for draft support
-- expires_at: drafts don't have an expiration yet
ALTER TABLE demos ALTER COLUMN expires_at DROP NOT NULL;

-- company_name: may not be filled until step 2/3
ALTER TABLE demos ALTER COLUMN company_name DROP NOT NULL;

-- website_url: may not be filled until step 2
ALTER TABLE demos ALTER COLUMN website_url DROP NOT NULL;

-- mission_profile: drop the existing CHECK constraint, then drop NOT NULL, then re-add CHECK allowing NULL
-- The old CHECK is named (auto-generated or explicit); drop it
ALTER TABLE demos DROP CONSTRAINT IF EXISTS demos_mission_profile_check;
ALTER TABLE demos ALTER COLUMN mission_profile DROP NOT NULL;
ALTER TABLE demos ADD CONSTRAINT demos_mission_profile_check
  CHECK (mission_profile IS NULL OR mission_profile IN ('reactivation', 'nurture', 'service', 'review'));

-- system_prompt: generated on activation, not needed for drafts
ALTER TABLE demos ALTER COLUMN system_prompt DROP NOT NULL;

-- openrouter_model: may not be selected until step 4
ALTER TABLE demos ALTER COLUMN openrouter_model DROP NOT NULL;

-- 4. Set existing demos to 'active' status
UPDATE demos SET status = 'active' WHERE status = 'draft' AND expires_at IS NOT NULL;

-- 5. Update RLS policies to exclude soft-deleted rows
DROP POLICY IF EXISTS "Allow read access to active demos" ON demos;
CREATE POLICY "Allow read access to demos" ON demos
  FOR SELECT
  USING (deleted_at IS NULL);

-- Allow updates (for autosave)
CREATE POLICY "Allow demo updates" ON demos
  FOR UPDATE
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

-- Allow soft delete (update deleted_at)
CREATE POLICY "Allow demo soft delete" ON demos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Drop and recreate insert policy to be more explicit
DROP POLICY IF EXISTS "Allow demo creation" ON demos;
CREATE POLICY "Allow demo creation" ON demos
  FOR INSERT
  WITH CHECK (true);

-- Allow actual DELETE for hard delete
CREATE POLICY "Allow demo hard delete" ON demos
  FOR DELETE
  USING (true);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_demos_status ON demos(status);
CREATE INDEX IF NOT EXISTS idx_demos_created_by ON demos(created_by);
CREATE INDEX IF NOT EXISTS idx_demos_deleted_at ON demos(deleted_at);

-- 7. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_demos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demos_updated_at ON demos;
CREATE TRIGGER demos_updated_at
  BEFORE UPDATE ON demos
  FOR EACH ROW
  EXECUTE FUNCTION update_demos_updated_at();
