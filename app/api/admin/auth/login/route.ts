import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  AdminLoginRequest,
  AdminLoginResponse,
  ADMIN_AUTH_COOKIE_NAME,
  SESSION_DURATION_MS,
} from '@/types';
import {
  authenticateAdmin,
  createAdminSession,
  encodeAdminSession,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body: AdminLoginRequest = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json<AdminLoginResponse>(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes('@')) {
      return NextResponse.json<AdminLoginResponse>(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Authenticate admin
    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      return NextResponse.json<AdminLoginResponse>(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = createAdminSession(admin);
    const encodedSession = encodeAdminSession(session);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_AUTH_COOKIE_NAME, encodedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return NextResponse.json<AdminLoginResponse>({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json<AdminLoginResponse>(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
