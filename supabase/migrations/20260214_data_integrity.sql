-- Data integrity: optimistic locking, audit trail, blueprint transition
-- Run in Supabase SQL Editor

-- 1. Add version column for optimistic locking
ALTER TABLE demos ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. Create demo_audit_log for state transitions
CREATE TABLE IF NOT EXISTS demo_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_demo_audit_log_demo_id ON demo_audit_log(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_audit_log_changed_at ON demo_audit_log(changed_at);

-- RLS
ALTER TABLE demo_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read audit log for demo access" ON demo_audit_log
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert audit log" ON demo_audit_log
  FOR INSERT
  WITH CHECK (true);

-- 3. Trigger: increment version on update
CREATE OR REPLACE FUNCTION demos_increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demos_version_increment ON demos;
CREATE TRIGGER demos_version_increment
  BEFORE UPDATE ON demos
  FOR EACH ROW
  EXECUTE FUNCTION demos_increment_version();

-- 4. Trigger: log status changes to audit_log
CREATE OR REPLACE FUNCTION demos_audit_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO demo_audit_log (demo_id, from_status, to_status, changed_by, metadata)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.created_by,
      jsonb_build_object('trigger', 'status_change')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demos_audit_status ON demos;
CREATE TRIGGER demos_audit_status
  AFTER UPDATE ON demos
  FOR EACH ROW
  EXECUTE FUNCTION demos_audit_status_change();
