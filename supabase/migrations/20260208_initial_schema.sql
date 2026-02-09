-- THE LAB Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Demos table
CREATE TABLE IF NOT EXISTS demos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Business Info (scraped/provided)
  company_name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT NOT NULL,
  products_services TEXT[] DEFAULT '{}',
  offers TEXT[] DEFAULT '{}',
  qualification_criteria TEXT[] DEFAULT '{}',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  secondary_color TEXT DEFAULT '#F8F9FA',
  
  -- AI Config
  mission_profile TEXT NOT NULL CHECK (mission_profile IN ('reactivation', 'nurture', 'service', 'review')),
  openrouter_model TEXT NOT NULL DEFAULT 'openai/gpt-4o',
  system_prompt TEXT NOT NULL
);

-- Rate limits config table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  description TEXT
);

-- Insert default rate limits
INSERT INTO rate_limits (key, value, description) VALUES
  ('messages_per_demo', 50, 'Maximum messages per demo session'),
  ('demos_per_hour', 10, 'Maximum demos created per hour'),
  ('api_calls_per_minute', 5, 'Maximum scraping API calls per minute'),
  ('tokens_per_demo', 10000, 'Maximum OpenRouter tokens per demo')
ON CONFLICT (key) DO NOTHING;

-- Create index for demo expiration queries
CREATE INDEX IF NOT EXISTS idx_demos_expires_at ON demos(expires_at);

-- Row Level Security (RLS)
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read access to non-expired demos
CREATE POLICY "Allow read access to active demos" ON demos
  FOR SELECT
  USING (expires_at > NOW());

-- Policy: Allow insert from authenticated or anon (for demo creation)
CREATE POLICY "Allow demo creation" ON demos
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow read access to rate limits
CREATE POLICY "Allow read rate limits" ON rate_limits
  FOR SELECT
  USING (true);
