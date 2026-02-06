import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAdminSession } from '@/lib/auth';
import {
  getProjectById,
  updateProject,
  deleteProject,
  isProjectOwner,
} from '@/lib/projects-db';
import { deleteProjectComments } from '@/lib/comments';
import { logAdminActivity } from '@/lib/admins';

interface UpdateProjectRequest {
  name?: string;
  clientPassword?: string;
}

/**
 * GET /api/admin/projects/[id] - Get a specific project
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await getProjectById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check ownership (super admins can access any project)
    if (!session.isSuperAdmin && project.ownerId !== session.adminId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/projects/[id] - Update a project
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check ownership (super admins can update any project)
    if (!session.isSuperAdmin) {
      const isOwner = await isProjectOwner(projectId, session.adminId);
      if (!isOwner) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const body: UpdateProjectRequest = await request.json();

    // Validate client password if provided
    if (body.clientPassword !== undefined && body.clientPassword.length < 4) {
      return NextResponse.json(
        { error: 'Client password must be at least 4 characters' },
        { status: 400 }
      );
    }

    const project = await updateProject(projectId, body);

    // Log the activity
    await logAdminActivity(session.adminId, 'update_project', {
      projectId: project.id,
      updates: Object.keys(body),
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/projects/[id] - Delete a project
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get project to verify it exists and check ownership
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check ownership (super admins can delete any project)
    if (!session.isSuperAdmin && project.ownerId !== session.adminId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 1. Delete all comments for this project
    let deletedComments = 0;
    try {
      deletedComments = await deleteProjectComments(projectId);
    } catch (error) {
      console.error('Failed to delete comments:', error);
      // Continue with deletion even if comments fail
    }

    // 2. Delete prototype files
    const prototypesDir = path.join(
      process.cwd(),
      'public',
      'prototypes',
      projectId
    );
    try {
      if (fs.existsSync(prototypesDir)) {
        fs.rmSync(prototypesDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Failed to delete prototype files:', error);
      // Continue with deletion even if files fail
    }

    // 3. Delete from database
    await deleteProject(projectId);

    // Log the activity
    await logAdminActivity(session.adminId, 'delete_project', {
      projectId,
      projectName: project.name,
      deletedComments,
    });

    return NextResponse.json({
      success: true,
      deletedComments,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
