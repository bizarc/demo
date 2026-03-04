-- Split function_technology into separate function and technology research types
-- Taxonomy: company | industry | function (domain/role) | technology (platform/tool)

-- 1. Add new skill definitions (function = domain e.g. Customer Service, Finance; technology = platform e.g. ServiceNow, Workday)
INSERT INTO skill_catalog (skill_key, skill_family, name, description, domain_tags, execution_modes, config_defaults, version, status)
VALUES
  ('research.function.v1', 'research', 'Function Intelligence', 'Business function or domain: best practices, SOPs, escalation, language (e.g. Customer Service, Finance, Sales, HR).', ARRAY['function', 'domain', 'sop'], ARRAY['assist', 'hitl'], '{"model": "perplexity/sonar"}'::jsonb, 1, 'active'),
  ('research.technology.v1', 'research', 'Technology Intelligence', 'Platform or tool: capabilities, troubleshooting, integration, adoption (e.g. ServiceNow, Workday, Salesforce).', ARRAY['technology', 'platform', 'tool'], ARRAY['assist', 'hitl'], '{"model": "perplexity/sonar"}'::jsonb, 1, 'active')
ON CONFLICT (skill_key) DO NOTHING;

-- 2. Deprecate the combined skill
UPDATE skill_catalog SET status = 'deprecated' WHERE skill_key = 'research.function_technology.v1';

-- 3. Migrate existing research records: function_technology -> function (legacy records treated as function)
UPDATE research_records SET research_type = 'function' WHERE research_type = 'function_technology';

-- 4. Document allowed research_type values (comment is advisory; no enum constraint to allow flexibility)
COMMENT ON COLUMN research_records.research_type IS 'One of: company, industry, function, technology';
