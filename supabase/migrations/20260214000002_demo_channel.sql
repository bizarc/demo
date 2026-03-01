-- Add channel to demos for Mission x Channels
-- Channel: sms | messenger | email | website | voice
-- Default 'website' for backward compatibility

ALTER TABLE demos
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'website';

-- SMS short code for routing inbound texts (e.g. "START-abc12345")
ALTER TABLE demos
ADD COLUMN IF NOT EXISTS sms_short_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demos_sms_short_code ON demos(sms_short_code) WHERE sms_short_code IS NOT NULL;
