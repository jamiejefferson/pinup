import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import {
  getAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  logAdminActivity,
} from '@/lib/admins';
import { UpdateAdminRequest } from '@/types/admin';

interface UpdateRequest extends UpdateAdminRequest {
  newPassword?: string;
}

/**
 * GET /api/admin/super/admins/[id] - Get a specific admin
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: adminId } = await params;

    const admin = await getAdmin(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/super/admins/[id] - Update an admin
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id: adminId } = await params;
    const body: UpdateRequest = await request.json();

    // Check if admin exists
    const existingAdmin = await getAdmin(adminId);
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Prevent demoting the last super admin
    if (body.isSuperAdmin === false && existingAdmin.isSuperAdmin) {
      // Check if this is the only super admin
      if (session.adminId === adminId) {
        return NextResponse.json(
          { error: 'Cannot demote yourself from super admin' },
          { status: 400 }
        );
      }
    }

    // Update password if provided
    if (body.newPassword) {
      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      await updateAdminPassword(adminId, body.newPassword);

      // Log the password reset
      await logAdminActivity(session.adminId, 'reset_password', {
        targetAdminId: adminId,
        targetAdminEmail: existingAdmin.email,
      });
    }

    // Update other fields
    const { newPassword: _, ...updateFields } = body;
    let updatedAdmin = existingAdmin;

    if (Object.keys(updateFields).length > 0) {
      updatedAdmin = await updateAdmin(adminId, updateFields);

      // Log the update
      await logAdminActivity(session.adminId, 'update_admin', {
        targetAdminId: adminId,
        updates: Object.keys(updateFields),
      });
    }

    return NextResponse.json({ success: true, admin: updatedAdmin });
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
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/super/admins/[id] - Delete an admin
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id: adminId } = await params;

    // Prevent self-deletion
    if (session.adminId === adminId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if admin exists
    const existingAdmin = await getAdmin(adminId);
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Delete the admin
    await deleteAdmin(adminId);

    // Log the deletion
    await logAdminActivity(session.adminId, 'delete_admin', {
      deletedAdminId: adminId,
      deletedAdminEmail: existingAdmin.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
