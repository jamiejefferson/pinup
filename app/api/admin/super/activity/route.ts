import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { getAllActivity } from '@/lib/admins';

/**
 * GET /api/admin/super/activity - Get all activity logs (super admin only)
 */
export async function GET(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const activity = await getAllActivity(Math.min(limit, 500));

    return NextResponse.json({ activity });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
