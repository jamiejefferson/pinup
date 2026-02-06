import { cookies } from 'next/headers';
import {
  AuthSession,
  AdminSession,
  AUTH_COOKIE_NAME,
  ADMIN_AUTH_COOKIE_NAME,
  SESSION_DURATION_MS,
  UserType,
} from '@/types';
import { getProject } from '@/lib/projects';
import {
  getAdminByEmail,
  verifyPassword,
  updateAdminLastLogin,
  logAdminActivity,
} from '@/lib/admins';

/**
 * Get the admin password from environment
 * @deprecated Use admin authentication instead
 */
export function getAdminPassword(): string {
  const password = process.env.PINUP_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('PINUP_ADMIN_PASSWORD environment variable is not set');
  }
  return password;
}

/**
 * Validate a password for a given project (client login)
 * Returns the user type if valid, null if invalid
 * 
 * Note: Admin password via PINUP_ADMIN_PASSWORD is deprecated.
 * Use the admin login system instead.
 */
export async function validatePassword(
  projectId: string,
  password: string
): Promise<UserType | null> {
  // Check legacy admin password first (for backward compatibility)
  try {
    const adminPassword = getAdminPassword();
    if (password === adminPassword) {
      return 'admin';
    }
  } catch {
    // Admin password not configured, continue to check project password
  }

  // Check project-specific client password
  const project = await getProject(projectId);
  if (project && password === project.clientPassword) {
    return 'client';
  }

  return null;
}

/**
 * Create an auth session
 */
export function createSession(
  projectId: string,
  userName: string,
  userType: UserType
): AuthSession {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  return {
    projectId,
    userName,
    userType,
    expiresAt,
  };
}

/**
 * Encode session to string for cookie storage
 */
export function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Decode session from cookie string
 */
export function decodeSession(encoded: string): AuthSession | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: AuthSession): boolean {
  return new Date(session.expiresAt) < new Date();
}

/**
 * Get the current session from cookies (for use in Server Components/Route Handlers)
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  const session = decodeSession(sessionCookie.value);
  if (!session || isSessionExpired(session)) {
    return null;
  }

  return session;
}

/**
 * Get session for a specific project
 * Returns null if no session or session is for a different project
 */
export async function getProjectSession(projectId: string): Promise<AuthSession | null> {
  const session = await getSession();
  if (!session || session.projectId !== projectId) {
    return null;
  }
  return session;
}

/**
 * Check if user can delete a comment
 * Admin can delete any, client can only delete their own
 */
export function canDeleteComment(
  session: AuthSession,
  commentAuthorName: string
): boolean {
  if (session.userType === 'admin') {
    return true;
  }
  return session.userName === commentAuthorName;
}

// ============================================
// ADMIN AUTHENTICATION
// ============================================

/**
 * Authenticate an admin by email and password
 * Returns the admin data if valid, null if invalid
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ id: string; email: string; name: string; isSuperAdmin: boolean } | null> {
  const admin = await getAdminByEmail(email);

  if (!admin) {
    return null;
  }

  if (!admin.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update last login time
  await updateAdminLastLogin(admin.id);

  // Log the login
  await logAdminActivity(admin.id, 'login');

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    isSuperAdmin: admin.isSuperAdmin,
  };
}

/**
 * Create an admin session
 */
export function createAdminSession(admin: {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}): AdminSession {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  return {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    isSuperAdmin: admin.isSuperAdmin,
    expiresAt,
  };
}

/**
 * Encode admin session to string for cookie storage
 */
export function encodeAdminSession(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Decode admin session from cookie string
 */
export function decodeAdminSession(encoded: string): AdminSession | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Check if admin session is expired
 */
export function isAdminSessionExpired(session: AdminSession): boolean {
  return new Date(session.expiresAt) < new Date();
}

/**
 * Get the current admin session from cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_AUTH_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const session = decodeAdminSession(sessionCookie.value);
  if (!session || isAdminSessionExpired(session)) {
    return null;
  }

  return session;
}

/**
 * Check if the current admin session is for a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.isSuperAdmin ?? false;
}

/**
 * Require admin session - throws if not authenticated
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Admin authentication required');
  }
  return session;
}

/**
 * Require super admin session - throws if not super admin
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Admin authentication required');
  }
  if (!session.isSuperAdmin) {
    throw new Error('Super admin access required');
  }
  return session;
}
