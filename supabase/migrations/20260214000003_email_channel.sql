-- Extend demos and sessions for Email channel (SendGrid Inbound Parse)

-- 1. Extend sessions.channel to include 'email'
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_channel_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_channel_check
  CHECK (channel IN ('chat', 'voice', 'sms', 'messenger', 'email'));

-- 2. Email short code for routing inbound emails (local part: start-{code}@inbound.domain.com)
ALTER TABLE demos ADD COLUMN IF NOT EXISTS email_short_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demos_email_short_code
  ON demos(email_short_code) WHERE email_short_code IS NOT NULL;
