-- Lock down PinUp tables so the public anon key cannot read or change them.
-- All access goes through the server with the service role key, which bypasses RLS.

-- Policy names from the migrations
DROP POLICY IF EXISTS "Allow all for admins" ON admins;
DROP POLICY IF EXISTS "Allow all for admin_activity" ON admin_activity;
DROP POLICY IF EXISTS "Allow all for projects" ON projects;
DROP POLICY IF EXISTS "Allow all for project_versions" ON project_versions;
DROP POLICY IF EXISTS "Allow all operations on password_reset_requests" ON password_reset_requests;

-- Policy names from supabase-schema.sql
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
DROP POLICY IF EXISTS "Allow all operations on admin_activity" ON admin_activity;
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
DROP POLICY IF EXISTS "Allow all operations on project_versions" ON project_versions;
DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;

-- comments had RLS switched off in production
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  admins,
  admin_activity,
  projects,
  project_versions,
  password_reset_requests,
  comments
FROM anon, authenticated;
