-- Seed KB skill definitions in skill_catalog

INSERT INTO skill_catalog (skill_key, skill_family, name, description, domain_tags, execution_modes, config_defaults, version, status)
VALUES
  ('kb.quality.customer_service.v1', 'knowledge_base', 'Customer Service KB Quality', 'Quality check and scorecard for customer service knowledge bases (FAQ, service menu).', ARRAY['customer_service', 'faq', 'quality'], ARRAY['assist', 'hitl'], '{}'::jsonb, 1, 'active'),
  ('kb.quality.generic.v1', 'knowledge_base', 'KB Quality Scorecard', 'Generic quality scorecard: document count, chunk count, coverage, promotion recommendation.', ARRAY['quality', 'governance'], ARRAY['assist', 'hitl'], '{}'::jsonb, 1, 'active')
ON CONFLICT (skill_key) DO NOTHING;
