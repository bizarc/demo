-- 20260301_agent_context.sql
-- Add new agent_context column
ALTER TABLE demos ADD COLUMN IF NOT EXISTS agent_context TEXT;

-- Migrate existing data: concat the three arrays into a readable prose block
UPDATE demos
SET agent_context = TRIM(CONCAT_WS(E'\n\n',
    CASE WHEN products_services IS NOT NULL AND array_length(products_services, 1) > 0
        THEN 'Products & Services: ' || array_to_string(products_services, ', ')
        ELSE NULL END,
    CASE WHEN offers IS NOT NULL AND array_length(offers, 1) > 0
        THEN 'Special Offers: ' || array_to_string(offers, ', ')
        ELSE NULL END,
    CASE WHEN qualification_criteria IS NOT NULL AND array_length(qualification_criteria, 1) > 0
        THEN 'Qualification Criteria: ' || array_to_string(qualification_criteria, ', ')
        ELSE NULL END
))
WHERE agent_context IS NULL AND (
    (products_services IS NOT NULL AND array_length(products_services, 1) > 0) OR
    (offers IS NOT NULL AND array_length(offers, 1) > 0) OR
    (qualification_criteria IS NOT NULL AND array_length(qualification_criteria, 1) > 0)
);

-- Drop old columns
ALTER TABLE demos DROP COLUMN IF EXISTS products_services;
ALTER TABLE demos DROP COLUMN IF EXISTS offers;
ALTER TABLE demos DROP COLUMN IF EXISTS qualification_criteria;
