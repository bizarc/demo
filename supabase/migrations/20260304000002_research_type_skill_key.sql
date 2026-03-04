-- Add research_type and skill_key to research_records for skill-driven research

ALTER TABLE research_records
  ADD COLUMN IF NOT EXISTS research_type TEXT,
  ADD COLUMN IF NOT EXISTS skill_key TEXT;

COMMENT ON COLUMN research_records.research_type IS 'One of: company, industry, function_technology';
COMMENT ON COLUMN research_records.skill_key IS 'e.g. research.company.profile.v1';

CREATE INDEX IF NOT EXISTS idx_research_records_research_type ON research_records(research_type);
CREATE INDEX IF NOT EXISTS idx_research_records_skill_key ON research_records(skill_key);
