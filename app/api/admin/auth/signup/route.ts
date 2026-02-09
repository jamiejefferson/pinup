import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdmin, getAdminByEmail, logAdminActivity } from '@/lib/admins';
import { createAdminSession, encodeAdminSession } from '@/lib/auth';
import { ADMIN_AUTH_COOKIE_NAME, SESSION_DURATION_MS } from '@/types';

const ALLOWED_DOMAIN = 'eqtr.com';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * POST /api/admin/auth/signup - Self-service admin registration
 * Only allows @eqtr.com email addresses
 */
export async function POST(request: Request) {
  try {
    const body: SignupRequest = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email domain
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (emailDomain !== ALLOWED_DOMAIN) {
      return NextResponse.json(
        { success: false, error: `Only @${ALLOWED_DOMAIN} email addresses are allowed` },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAdmin = await getAdminByEmail(email);
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create the admin account (not super admin)
    const admin = await createAdmin({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      isSuperAdmin: false,
    });

    // Log the signup
    await logAdminActivity(admin.id, 'signup');

    // Create session and set cookie (auto-login)
    const session = createAdminSession({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      isSuperAdmin: admin.isSuperAdmin,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: ADMIN_AUTH_COOKIE_NAME,
      value: encodeAdminSession(session),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
