import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_AUTH_COOKIE_NAME } from '@/types';
import { getAdminSession } from '@/lib/auth';
import { logAdminActivity } from '@/lib/admins';

export async function POST() {
  try {
    // Log the logout if we have a session
    const session = await getAdminSession();
    if (session) {
      await logAdminActivity(session.adminId, 'logout');
    }

    // Clear the admin session cookie
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_AUTH_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
