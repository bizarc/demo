-- Use "reviewed" and "approved" across DB; add demo_knowledge_bases link table and remove demos.knowledge_base_id (no backward compatibility).

-- 1. research_records: status values -> reviewed, approved
UPDATE research_records SET status = 'reviewed' WHERE status = 'validated';
UPDATE research_records SET status = 'approved' WHERE status = 'production_approved';

ALTER TABLE research_records DROP CONSTRAINT IF EXISTS research_records_status_check;
ALTER TABLE research_records ADD CONSTRAINT research_records_status_check
  CHECK (status IN ('draft', 'reviewed', 'approved', 'archived'));

-- 2. knowledge_bases: ensure status uses reviewed/approved
ALTER TABLE knowledge_bases DROP CONSTRAINT IF EXISTS knowledge_bases_status_check;
ALTER TABLE knowledge_bases ADD CONSTRAINT knowledge_bases_status_check
  CHECK (status IN ('draft', 'reviewed', 'approved', 'archived'));

-- 3. demo_knowledge_bases link table (demos reference KBs only via this table)
CREATE TABLE IF NOT EXISTS demo_knowledge_bases (
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (demo_id, kb_id)
);

CREATE INDEX IF NOT EXISTS idx_demo_knowledge_bases_demo_id ON demo_knowledge_bases(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_knowledge_bases_kb_id ON demo_knowledge_bases(kb_id);

-- 4. Migrate existing demo->KB associations into link table
INSERT INTO demo_knowledge_bases (demo_id, kb_id)
  SELECT id, knowledge_base_id FROM demos WHERE knowledge_base_id IS NOT NULL
  ON CONFLICT (demo_id, kb_id) DO NOTHING;

-- 5. Drop demos.knowledge_base_id (no backward compatibility)
ALTER TABLE demos DROP CONSTRAINT IF EXISTS demos_knowledge_base_id_fkey;
ALTER TABLE demos DROP COLUMN IF EXISTS knowledge_base_id;

-- 6. RLS for demo_knowledge_bases (match existing permissive pattern)
ALTER TABLE demo_knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all demo_knowledge_bases" ON demo_knowledge_bases
  FOR ALL USING (true) WITH CHECK (true);
