import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LoginRequest, LoginResponse, AUTH_COOKIE_NAME, SESSION_DURATION_MS } from '@/types';
import { validatePassword, createSession, encodeSession } from '@/lib/auth';
import { projectExists } from '@/lib/projects';

export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json();
    const { projectId, password, name } = body;

    // Validate required fields
    if (!projectId || !password || !name) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Check if project exists
    if (!projectExists(projectId)) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate password
    const userType = validatePassword(projectId, password);
    
    if (!userType) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session
    const session = createSession(projectId, name.trim(), userType);
    const encodedSession = encodeSession(session);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, encodedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000, // Convert to seconds
      path: '/',
    });

    return NextResponse.json<LoginResponse>({
      success: true,
      userType,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<LoginResponse>(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
