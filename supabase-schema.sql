-- PinUp Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up your database
--
-- For a fresh install, run this entire file.
-- For existing installations, see supabase/migrations/001_multi_tenancy.sql

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS admins_email_idx ON admins (email);

-- ============================================
-- ADMIN ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for activity lookups
CREATE INDEX IF NOT EXISTS admin_activity_admin_idx ON admin_activity (admin_id);
CREATE INDEX IF NOT EXISTS admin_activity_created_idx ON admin_activity (created_at DESC);

-- ============================================
-- PASSWORD RESET REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Index for pending requests lookup
CREATE INDEX IF NOT EXISTS password_reset_requests_admin_idx ON password_reset_requests (admin_id);
CREATE INDEX IF NOT EXISTS password_reset_requests_pending_idx ON password_reset_requests (resolved_at) WHERE resolved_at IS NULL;

-- RLS
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on password_reset_requests" ON password_reset_requests
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_password TEXT NOT NULL,
  owner_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects (owner_id);

-- ============================================
-- PROJECT VERSIONS TABLE
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
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('client', 'admin')),
  text TEXT NOT NULL,
  element_selector TEXT NOT NULL,
  element_text TEXT,
  click_x NUMERIC NOT NULL,
  click_y NUMERIC NOT NULL,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'tablet', 'desktop'))
);

-- Index for faster lookups by project and version
CREATE INDEX IF NOT EXISTS comments_project_version_idx ON comments (project_id, version_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (server-side auth handles authorization)
-- Adjust these policies based on your security requirements

CREATE POLICY "Allow all operations on admins" ON admins
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on admin_activity" ON admin_activity
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on project_versions" ON project_versions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Get Next Version ID
-- ============================================
CREATE OR REPLACE FUNCTION get_next_version_id(p_project_id TEXT)
RETURNS TEXT AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)), 0)
  INTO max_version
  FROM project_versions
  WHERE project_id = p_project_id
  AND id ~ '^v[0-9]+$';
  
  RETURN 'v' || (max_version + 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- After running this SQL, go to Storage in Supabase dashboard and:
-- 1. Create a bucket named "Prototypes"
-- 2. Make it public (for serving prototype files)
