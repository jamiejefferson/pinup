import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, AuthSession } from '@/types';

/**
 * Decode session from cookie string (Edge-compatible)
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
 * Check if session is expired
 */
function isSessionExpired(session: AuthSession): boolean {
  return new Date(session.expiresAt) < new Date();
}

/**
 * Middleware to protect project routes
 * Redirects to login if not authenticated
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for:
  // - API routes (handled separately)
  // - Static files
  // - Login pages
  // - Prototype files
  // - Root page
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/prototypes') ||
    pathname.includes('/login') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract project ID from path (e.g., /hotel-booking -> hotel-booking)
  const projectId = pathname.split('/')[1];

  if (!projectId) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!sessionCookie?.value) {
    // No session, redirect to login
    return NextResponse.redirect(new URL(`/${projectId}/login`, request.url));
  }

  // Decode and validate session
  const session = decodeSession(sessionCookie.value);

  if (!session) {
    // Invalid session, redirect to login
    return NextResponse.redirect(new URL(`/${projectId}/login`, request.url));
  }

  if (isSessionExpired(session)) {
    // Expired session, redirect to login
    const response = NextResponse.redirect(new URL(`/${projectId}/login`, request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  // Check if session is for the correct project
  if (session.projectId !== projectId) {
    // Session is for a different project, redirect to login
    return NextResponse.redirect(new URL(`/${projectId}/login`, request.url));
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
