-- Seed outreach (professional communication) skills

INSERT INTO skill_catalog (skill_key, skill_family, name, description, domain_tags, execution_modes, config_defaults, version, status)
VALUES
  ('outreach.prospecting.email.v1', 'outreach', 'Prospecting Email', 'Generate cold outreach email subject and body for a prospect. Uses RECON research and KB context.', ARRAY['email', 'prospecting', 'cold_outreach'], ARRAY['assist', 'hitl'], '{"model": "openai/gpt-4o-mini"}'::jsonb, 1, 'active'),
  ('outreach.linkedin.message.v1', 'outreach', 'LinkedIn Message', 'Generate LinkedIn connection request or InMail message for a prospect. Channel-constrained length and tone.', ARRAY['linkedin', 'prospecting'], ARRAY['assist', 'hitl'], '{"model": "openai/gpt-4o-mini"}'::jsonb, 1, 'active')
ON CONFLICT (skill_key) DO NOTHING;
