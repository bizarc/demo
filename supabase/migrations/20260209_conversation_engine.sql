-- Conversation Engine: leads, sessions, messages
-- Run this in Supabase SQL Editor after the initial schema

-- Leads table: unique people interacting with demos
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'phone', 'anonymous')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- A lead is unique per demo + identifier combo
  UNIQUE(demo_id, identifier)
);

-- Sessions table: individual conversation sessions (one per channel interaction)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('chat', 'voice', 'sms')) DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Messages table: individual messages within sessions
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  token_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_leads_demo_id ON leads(demo_id);
CREATE INDEX IF NOT EXISTS idx_leads_identifier ON leads(demo_id, identifier);
CREATE INDEX IF NOT EXISTS idx_sessions_lead_id ON sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sessions_demo_id ON sessions(demo_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(session_id, created_at);

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to leads for their demo
CREATE POLICY "Allow read leads" ON leads
  FOR SELECT USING (true);

-- Policy: Allow insert leads (for anonymous chat start)
CREATE POLICY "Allow create leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Policy: Allow update leads (last_seen_at, display_name)
CREATE POLICY "Allow update leads" ON leads
  FOR UPDATE USING (true);

-- Policy: Allow read sessions
CREATE POLICY "Allow read sessions" ON sessions
  FOR SELECT USING (true);

-- Policy: Allow create sessions
CREATE POLICY "Allow create sessions" ON sessions
  FOR INSERT WITH CHECK (true);

-- Policy: Allow update sessions (ended_at)
CREATE POLICY "Allow update sessions" ON sessions
  FOR UPDATE USING (true);

-- Policy: Allow read messages
CREATE POLICY "Allow read messages" ON messages
  FOR SELECT USING (true);

-- Policy: Allow create messages
CREATE POLICY "Allow create messages" ON messages
  FOR INSERT WITH CHECK (true);
