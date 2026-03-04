-- Add type-specific research output and context_block to research_records
-- research_data: JSONB for type-specific fields (key_players, market_trends, etc.)
-- context_block: TEXT for the universal context_block from prompts

ALTER TABLE research_records
  ADD COLUMN IF NOT EXISTS research_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS context_block TEXT;

COMMENT ON COLUMN research_records.research_data IS 'Type-specific structured output: company (offerings, tech_stack, market_position), industry (key_players, market_trends, etc.), function/technology (related_roles, alternatives, etc.)';
COMMENT ON COLUMN research_records.context_block IS 'Universal 2-3 paragraph context block from research prompt';

-- Use openai/gpt-4o for function research (domain knowledge, no web search needed)
UPDATE skill_catalog SET config_defaults = '{"model": "openai/gpt-4o"}'::jsonb WHERE skill_key = 'research.function.v1';
