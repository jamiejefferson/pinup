-- PinUp v2 Multi-Tenancy Migration
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for email lookups during login
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ============================================
-- 2. ADMIN ACTIVITY TABLE (for usage tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying activity by admin
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity(admin_id);
-- Index for querying recent activity
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity(created_at DESC);

-- ============================================
-- 3. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_password TEXT NOT NULL,
  owner_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying projects by owner
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- ============================================
-- 4. PROJECT VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_versions (
  id TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, id)
);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we handle auth in the app layer)
-- You can tighten these policies later if needed

CREATE POLICY "Allow all for admins" ON admins
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for admin_activity" ON admin_activity
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for project_versions" ON project_versions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to get the next version ID for a project
CREATE OR REPLACE FUNCTION get_next_version_id(p_project_id TEXT)
RETURNS TEXT AS $$
DECLARE
  max_version INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INT)), 0)
  INTO max_version
  FROM project_versions
  WHERE project_id = p_project_id AND id ~ '^v[0-9]+$';
  
  RETURN 'v' || (max_version + 1);
END;
$$ LANGUAGE plpgsql;
