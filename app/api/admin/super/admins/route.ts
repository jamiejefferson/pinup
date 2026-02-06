import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { createAdmin, getAllAdmins, logAdminActivity } from '@/lib/admins';
import { CreateAdminRequest } from '@/types/admin';

/**
 * GET /api/admin/super/admins - List all admins (super admin only)
 */
export async function GET() {
  try {
    await requireSuperAdmin();
    const admins = await getAllAdmins();

    return NextResponse.json({ admins });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/super/admins - Create a new admin (super admin only)
 */
export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body: CreateAdminRequest = await request.json();
    const { email, password, name, isSuperAdmin } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create the admin
    const admin = await createAdmin({
      email,
      password,
      name: name.trim(),
      isSuperAdmin: isSuperAdmin ?? false,
    });

    // Log the activity
    await logAdminActivity(session.adminId, 'create_admin', {
      newAdminId: admin.id,
      newAdminEmail: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
    });

    return NextResponse.json({ success: true, admin }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'An admin with this email already exists' },
          { status: 409 }
        );
      }
    }
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
