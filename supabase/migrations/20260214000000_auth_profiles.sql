-- Auth & RBAC: profiles and workspaces
-- Run in Supabase SQL Editor after enabling Auth

-- Workspaces (client/tenant scope)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Profiles: links auth.users to role and workspace
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'operator', 'client_viewer')),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Workspaces: super_admin sees all; operator sees own
CREATE POLICY "Super admin read all workspaces" ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Operator read own workspace" ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.workspace_id = workspaces.id
    )
  );

-- Profiles: users can read own profile
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Super admin can manage profiles
CREATE POLICY "Super admin manage profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Trigger: create profile on signup (default operator)
-- Run manually for first user: INSERT INTO profiles (id, role) VALUES ('user-uuid', 'super_admin');
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'operator')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if auth.users exists (Supabase Auth enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Insert default workspace for single-tenant
INSERT INTO workspaces (id, name)
SELECT '00000000-0000-0000-0000-000000000001', 'Default'
WHERE NOT EXISTS (SELECT 1 FROM workspaces WHERE id = '00000000-0000-0000-0000-000000000001');
