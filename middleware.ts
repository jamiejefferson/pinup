import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  ADMIN_AUTH_COOKIE_NAME,
  AuthSession,
  AdminSession,
} from '@/types';

/**
 * Decode project/client session from cookie string (Edge-compatible)
 */
function decodeSession(encoded: string): AuthSession | null {
  try {
    const decoded = atob(encoded);
    return JSON.parse(decoded) as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Decode admin session from cookie string (Edge-compatible)
 */
function decodeAdminSession(encoded: string): AdminSession | null {
  try {
    const decoded = atob(encoded);
    return JSON.parse(decoded) as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Check if session is expired
 */
function isSessionExpired(session: { expiresAt: string }): boolean {
  return new Date(session.expiresAt) < new Date();
}

/**
 * Handle admin route protection
 */
function handleAdminRoute(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Allow access to admin login page
  if (pathname === '/admin/login') {
    return null;
  }

  // Check for admin auth cookie
  const adminCookie = request.cookies.get(ADMIN_AUTH_COOKIE_NAME);

  if (!adminCookie?.value) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Decode and validate admin session
  const session = decodeAdminSession(adminCookie.value);

  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (isSessionExpired(session)) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(ADMIN_AUTH_COOKIE_NAME);
    return response;
  }

  // Check super admin access for /admin/super/* routes
  if (pathname.startsWith('/admin/super')) {
    if (!session.isSuperAdmin) {
      // Not a super admin, redirect to dashboard
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return null;
}

/**
 * Handle project route protection
 */
function handleProjectRoute(
  request: NextRequest,
  projectId: string
): NextResponse | null {
  // Check for auth cookie
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL(`/${projectId}/login`, request.url));
  }

  // Decode and validate session
  const session = decodeSession(sessionCookie.value);

  if (!session) {
    return NextResponse.redirect(new URL(`/${projectId}/login`, request.url));
  }

  if (isSessionExpired(session)) {
    const response = NextResponse.redirect(
      new URL(`/${projectId}/login`, request.url)
    );
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  // Check if session is for the correct project
  if (session.projectId !== projectId) {
    return NextResponse.redirect(new URL(`/${projectId}/login`, request.url));
  }

  return null;
}

/**
 * Middleware to protect routes
 * - Admin routes: /admin/*
 * - Project routes: /[project]/*
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for:
  // - API routes (handled separately)
  // - Static files
  // - Prototype files
  // - Root page
  // - Files with extensions
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/prototypes') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    const adminResponse = handleAdminRoute(request);
    if (adminResponse) {
      return adminResponse;
    }
    return NextResponse.next();
  }

  // Handle project login pages (allow access)
  if (pathname.includes('/login')) {
    return NextResponse.next();
  }

  // Extract project ID from path (e.g., /hotel-booking -> hotel-booking)
  const projectId = pathname.split('/')[1];

  if (!projectId) {
    return NextResponse.next();
  }

  // Handle project routes
  const projectResponse = handleProjectRoute(request, projectId);
  if (projectResponse) {
    return projectResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
