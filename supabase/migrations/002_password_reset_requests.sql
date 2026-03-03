-- Password Reset Requests
-- Allows admins to request a password reset, which is flagged on the super admin dashboard

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
