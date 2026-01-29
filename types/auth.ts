import { UserType } from './comment';

/**
 * Authentication session stored in cookie
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
 * Login request body
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
 * Session duration in milliseconds (24 hours)
 */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Cookie name for auth session
 */
export const AUTH_COOKIE_NAME = 'pinup_session';
