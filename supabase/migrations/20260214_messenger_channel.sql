-- Extend sessions and demos for Messenger (WhatsApp) channel

-- 1. Extend sessions.channel to include 'messenger'
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_channel_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_channel_check
  CHECK (channel IN ('chat', 'voice', 'sms', 'messenger'));

-- 2. Extend leads.identifier_type for WhatsApp
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_identifier_type_check;
ALTER TABLE leads ADD CONSTRAINT leads_identifier_type_check
  CHECK (identifier_type IN ('email', 'phone', 'anonymous', 'whatsapp'));

-- 3. WhatsApp short code for routing inbound WhatsApp messages
ALTER TABLE demos ADD COLUMN IF NOT EXISTS whatsapp_short_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demos_whatsapp_short_code
  ON demos(whatsapp_short_code) WHERE whatsapp_short_code IS NOT NULL;
