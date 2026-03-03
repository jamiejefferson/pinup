import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { resolveResetRequest } from '@/lib/admins';

/**
 * PUT /api/admin/super/reset-requests/[id] - Dismiss a password reset request
 */
export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: requestId } = await params;

    await resolveResetRequest(requestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error resolving reset request:', error);
    return NextResponse.json(
      { error: 'Failed to resolve reset request' },
      { status: 500 }
    );
  }
}
