-- Extend demos for Voice channel (Twilio)

-- Voice short code: 8 digits for DTMF entry when caller connects
ALTER TABLE demos ADD COLUMN IF NOT EXISTS voice_short_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demos_voice_short_code
  ON demos(voice_short_code) WHERE voice_short_code IS NOT NULL;
