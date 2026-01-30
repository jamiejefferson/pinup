import { cookies } from 'next/headers';
import { AuthSession, AUTH_COOKIE_NAME, SESSION_DURATION_MS, UserType } from '@/types';
import { getProject } from '@/lib/projects';

/**
 * Get the admin password from environment
 */
export function getAdminPassword(): string {
  const password = process.env.PINUP_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('PINUP_ADMIN_PASSWORD environment variable is not set');
  }
  return password;
}

/**
 * Validate a password for a given project
 * Returns the user type if valid, null if invalid
 */
export function validatePassword(projectId: string, password: string): UserType | null {
  // Check admin password first
  try {
    const adminPassword = getAdminPassword();
    if (password === adminPassword) {
      return 'admin';
    }
  } catch {
    // Admin password not configured, continue to check project password
  }

  // Check project-specific client password
  const project = getProject(projectId);
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
