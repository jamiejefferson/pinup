import { NextResponse } from 'next/server';
import {
  getAdminByEmail,
  createPasswordResetRequest,
  hasPendingResetRequest,
  logAdminActivity,
} from '@/lib/admins';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      // Still return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    const admin = await getAdminByEmail(email);

    if (admin && admin.isActive) {
      // Rate limit: skip if a pending request already exists
      const alreadyPending = await hasPendingResetRequest(admin.id);

      if (!alreadyPending) {
        await createPasswordResetRequest(admin.id);
        await logAdminActivity(admin.id, 'password_reset_request');
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success to prevent information leakage
    return NextResponse.json({ success: true });
  }
}
