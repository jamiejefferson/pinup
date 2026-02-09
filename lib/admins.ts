import 'server-only';
import { getSupabase } from './supabase';
import {
  Admin,
  AdminWithHash,
  CreateAdminRequest,
  UpdateAdminRequest,
  AdminActivity,
  AdminAction,
} from '@/types/admin';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

/**
 * Database row type (snake_case)
 */
interface AdminRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_super_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  is_active: boolean;
}

interface AdminActivityRow {
  id: string;
  admin_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Convert database row to Admin type
 */
function rowToAdmin(row: AdminRow): Admin {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isSuperAdmin: row.is_super_admin,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    isActive: row.is_active,
  };
}

/**
 * Convert database row to AdminWithHash type
 */
function rowToAdminWithHash(row: AdminRow): AdminWithHash {
  return {
    ...rowToAdmin(row),
    passwordHash: row.password_hash,
  };
}

/**
 * Convert database row to AdminActivity type
 */
function rowToActivity(row: AdminActivityRow): AdminActivity {
  return {
    id: row.id,
    adminId: row.admin_id,
    action: row.action as AdminAction,
    details: row.details,
    createdAt: row.created_at,
  };
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new admin account
 */
export async function createAdmin(
  request: CreateAdminRequest
): Promise<Admin> {
  const supabase = getSupabase();
  const passwordHash = await hashPassword(request.password);

  const { data, error } = await supabase
    .from('admins')
    .insert({
      email: request.email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: request.name.trim(),
      is_super_admin: request.isSuperAdmin ?? false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('An admin with this email already exists');
    }
    throw new Error(`Failed to create admin: ${error.message}`);
  }

  return rowToAdmin(data as AdminRow);
}

/**
 * Get an admin by ID
 */
export async function getAdmin(id: string): Promise<Admin | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch admin: ${error.message}`);
  }

  return rowToAdmin(data as AdminRow);
}

/**
 * Get an admin by email (includes password hash for authentication)
 */
export async function getAdminByEmail(
  email: string
): Promise<AdminWithHash | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch admin: ${error.message}`);
  }

  return rowToAdminWithHash(data as AdminRow);
}

/**
 * Get all admins (for super admin)
 */
export async function getAllAdmins(): Promise<Admin[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch admins: ${error.message}`);
  }

  return (data as AdminRow[]).map(rowToAdmin);
}

/**
 * Update an admin
 */
export async function updateAdmin(
  id: string,
  request: UpdateAdminRequest
): Promise<Admin> {
  const supabase = getSupabase();

  const updates: Record<string, unknown> = {};
  if (request.email !== undefined) {
    updates.email = request.email.toLowerCase().trim();
  }
  if (request.name !== undefined) {
    updates.name = request.name.trim();
  }
  if (request.isActive !== undefined) {
    updates.is_active = request.isActive;
  }
  if (request.isSuperAdmin !== undefined) {
    updates.is_super_admin = request.isSuperAdmin;
  }

  const { data, error } = await supabase
    .from('admins')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('An admin with this email already exists');
    }
    throw new Error(`Failed to update admin: ${error.message}`);
  }

  return rowToAdmin(data as AdminRow);
}

/**
 * Update admin's password
 */
export async function updateAdminPassword(
  id: string,
  newPassword: string
): Promise<void> {
  const supabase = getSupabase();
  const passwordHash = await hashPassword(newPassword);

  const { error } = await supabase
    .from('admins')
    .update({ password_hash: passwordHash })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update password: ${error.message}`);
  }
}

/**
 * Update admin's last login timestamp
 */
export async function updateAdminLastLogin(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('admins')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Failed to update last login:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Delete an admin
 */
export async function deleteAdmin(id: string): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete admin: ${error.message}`);
  }

  return true;
}

/**
 * Log an admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: AdminAction,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('admin_activity').insert({
    admin_id: adminId,
    action,
    details: details ?? null,
  });

  if (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break the main operation
  }
}

/**
 * Get activity log for an admin
 */
export async function getAdminActivity(
  adminId: string,
  limit = 50
): Promise<AdminActivity[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('admin_activity')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch activity: ${error.message}`);
  }

  return (data as AdminActivityRow[]).map(rowToActivity);
}

/**
 * Get all activity (for super admin)
 */
export async function getAllActivity(limit = 100): Promise<AdminActivity[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('admin_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch activity: ${error.message}`);
  }

  return (data as AdminActivityRow[]).map(rowToActivity);
}

/**
 * Admin with project count for public team display
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  projectCount: number;
}

/**
 * Get active team members (admins) with their project counts
 * Used for the public team page / homepage
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = getSupabase();

  // Get active admins
  const { data: admins, error: adminError } = await supabase
    .from('admins')
    .select('id, name, email')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (adminError) {
    console.error('Failed to fetch team members:', adminError);
    return [];
  }

  if (!admins || admins.length === 0) {
    return [];
  }

  // Get project counts for each admin
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('owner_id');

  if (projectError) {
    console.error('Failed to fetch project counts:', projectError);
    // Return admins without project counts
    return admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      projectCount: 0,
    }));
  }

  // Count projects per admin
  const projectCounts = new Map<string, number>();
  for (const project of projects || []) {
    const count = projectCounts.get(project.owner_id) || 0;
    projectCounts.set(project.owner_id, count + 1);
  }

  return admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    projectCount: projectCounts.get(admin.id) || 0,
  }));
}

/**
 * Check if any super admin exists (for initial setup)
 */
export async function hasSuperAdmin(): Promise<boolean> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('admins')
    .select('*', { count: 'exact', head: true })
    .eq('is_super_admin', true);

  if (error) {
    throw new Error(`Failed to check for super admin: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

/**
 * Create initial super admin from environment variables
 */
export async function createInitialSuperAdmin(): Promise<Admin | null> {
  const email = process.env.PINUP_SUPER_ADMIN_EMAIL;
  const password = process.env.PINUP_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  // Check if this admin already exists
  const existing = await getAdminByEmail(email);
  if (existing) {
    return rowToAdmin({
      id: existing.id,
      email: existing.email,
      password_hash: existing.passwordHash,
      name: existing.name,
      is_super_admin: existing.isSuperAdmin,
      created_at: existing.createdAt,
      last_login_at: existing.lastLoginAt,
      is_active: existing.isActive,
    });
  }

  // Create the super admin
  return createAdmin({
    email,
    password,
    name: 'Super Admin',
    isSuperAdmin: true,
  });
}
