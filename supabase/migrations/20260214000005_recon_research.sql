-- RECON: Research records and link tables
-- Prerequisite: Run 20260214_auth_profiles.sql first (workspaces must exist)

-- 1. Research records table (use TEXT for enums for flexibility)
CREATE TABLE IF NOT EXISTS research_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_id UUID,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('perplexity', 'scrape', 'manual', 'import')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  competitors TEXT[] DEFAULT '{}',
  market_position TEXT,
  offerings TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  evidence JSONB DEFAULT '[]',
  confidence_score FLOAT CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'production_approved', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_records_workspace ON research_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_research_records_status ON research_records(status);
CREATE INDEX IF NOT EXISTS idx_research_records_target ON research_records(target_id);

-- 2. Research links (record -> demo, campaign, blueprint)
CREATE TABLE IF NOT EXISTS research_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  research_id UUID NOT NULL REFERENCES research_records(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('demo', 'campaign', 'blueprint')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_links_research ON research_links(research_id);
CREATE INDEX IF NOT EXISTS idx_research_links_target ON research_links(link_type, target_id);

-- 3. RLS (permissive for MVP; tighten when RBAC is enforced)
ALTER TABLE research_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read research" ON research_records FOR SELECT USING (true);
CREATE POLICY "Allow insert research" ON research_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update research" ON research_records FOR UPDATE USING (true);

CREATE POLICY "Allow read research links" ON research_links FOR SELECT USING (true);
CREATE POLICY "Allow insert research links" ON research_links FOR INSERT WITH CHECK (true);
