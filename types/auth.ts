import { UserType } from './comment';

/**
 * Authentication session stored in cookie (for client/project access)
 */
export interface AuthSession {
  /** Project ID this session is for */
  projectId: string;
  /** Name entered by user at login */
  userName: string;
  /** Type of user (client or admin) */
  userType: UserType;
  /** ISO timestamp when session expires */
  expiresAt: string;
}

/**
 * Admin session stored in cookie
 */
export interface AdminSession {
  /** Admin's unique ID */
  adminId: string;
  /** Admin's email */
  email: string;
  /** Admin's display name */
  name: string;
  /** Whether this admin is a super admin */
  isSuperAdmin: boolean;
  /** ISO timestamp when session expires */
  expiresAt: string;
}

/**
 * Login request body (for project/client access)
 */
export interface LoginRequest {
  /** Project ID attempting to access */
  projectId: string;
  /** Password entered by user */
  password: string;
  /** Name entered by user for comment attribution */
  name: string;
}

/**
 * Login response body
 */
export interface LoginResponse {
  success: boolean;
  userType?: UserType;
  error?: string;
}

/**
 * Admin login request body
 */
export interface AdminLoginRequest {
  /** Admin's email */
  email: string;
  /** Admin's password */
  password: string;
}

/**
 * Admin login response body
 */
export interface AdminLoginResponse {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    name: string;
    isSuperAdmin: boolean;
  };
  error?: string;
}

/**
 * Session duration in milliseconds (24 hours)
 */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Cookie name for project/client auth session
 */
export const AUTH_COOKIE_NAME = 'pinup_session';

/**
 * Cookie name for admin auth session
 */
export const ADMIN_AUTH_COOKIE_NAME = 'pinup_admin_session';
