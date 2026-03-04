-- RECON Skill Catalog and Skill Runs
-- Skill catalog: registry of versioned skills (research, knowledge_base, outreach)
-- Skill runs: audit trail of each execution with lifecycle and approval provenance

-- 1. skill_catalog: canonical registry of skills
CREATE TABLE IF NOT EXISTS skill_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_key TEXT NOT NULL UNIQUE,
  skill_family TEXT NOT NULL CHECK (skill_family IN ('research', 'knowledge_base', 'outreach')),
  name TEXT NOT NULL,
  description TEXT,
  domain_tags TEXT[] DEFAULT '{}',
  execution_modes TEXT[] NOT NULL DEFAULT '{assist,hitl}' CHECK (
    array_length(execution_modes, 1) > 0 AND
    execution_modes <@ ARRAY['assist', 'hitl', 'autonomous']::TEXT[]
  ),
  input_schema JSONB DEFAULT '{}',
  output_schema JSONB DEFAULT '{}',
  quality_gates JSONB DEFAULT '[]',
  approval_requirements JSONB DEFAULT '{}',
  config_defaults JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skill_catalog_family ON skill_catalog(skill_family);
CREATE INDEX IF NOT EXISTS idx_skill_catalog_status ON skill_catalog(status);
CREATE INDEX IF NOT EXISTS idx_skill_catalog_key ON skill_catalog(skill_key);

-- 2. skill_runs: history of each skill execution with audit fields
CREATE TABLE IF NOT EXISTS skill_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID NOT NULL REFERENCES skill_catalog(id) ON DELETE RESTRICT,
  skill_key TEXT NOT NULL,
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('assist', 'hitl', 'autonomous')),
  input_payload JSONB NOT NULL DEFAULT '{}',
  output_payload JSONB,
  output_asset_id UUID,
  output_asset_type TEXT CHECK (output_asset_type IN ('research_record', 'knowledge_base', 'campaign_step', 'outreach_draft')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  lifecycle_state TEXT CHECK (lifecycle_state IN ('draft', 'reviewed', 'approved', 'archived')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_skill_runs_skill ON skill_runs(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_runs_skill_key ON skill_runs(skill_key);
CREATE INDEX IF NOT EXISTS idx_skill_runs_created ON skill_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_runs_created_by ON skill_runs(created_by);
CREATE INDEX IF NOT EXISTS idx_skill_runs_output_asset ON skill_runs(output_asset_type, output_asset_id);

-- Trigger to keep skill_catalog.updated_at current
CREATE TRIGGER skill_catalog_updated_at
  BEFORE UPDATE ON skill_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE skill_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read skill_catalog" ON skill_catalog FOR SELECT USING (true);
CREATE POLICY "Allow insert skill_catalog" ON skill_catalog FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update skill_catalog" ON skill_catalog FOR UPDATE USING (true);

CREATE POLICY "Allow read skill_runs" ON skill_runs FOR SELECT USING (true);
CREATE POLICY "Allow insert skill_runs" ON skill_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update skill_runs" ON skill_runs FOR UPDATE USING (true);

-- Seed initial research skill definitions (company, industry, function_technology)
INSERT INTO skill_catalog (skill_key, skill_family, name, description, domain_tags, execution_modes, config_defaults, version, status)
VALUES
  ('research.company.profile.v1', 'research', 'Company Intelligence', 'Profile a company for demo prep, account planning, onboarding context.', ARRAY['company', 'demo', 'account'], ARRAY['assist', 'hitl'], '{"model": "perplexity/sonar"}'::jsonb, 1, 'active'),
  ('research.industry.landscape.v1', 'research', 'Industry Intelligence', 'Industry trends, buying triggers, vertical playbooks for RADAR and campaigns.', ARRAY['industry', 'radar', 'vertical'], ARRAY['assist', 'hitl'], '{"model": "perplexity/sonar"}'::jsonb, 1, 'active'),
  ('research.function_technology.v1', 'research', 'Function / Technology Intelligence', 'SOPs, troubleshooting playbooks, tool/domain guidance (e.g. ServiceNow).', ARRAY['function', 'technology', 'sop'], ARRAY['assist', 'hitl'], '{"model": "perplexity/sonar"}'::jsonb, 1, 'active')
ON CONFLICT (skill_key) DO NOTHING;
