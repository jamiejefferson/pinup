import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProject, deleteProjectFromConfig } from '@/lib/projects';
import { deleteProjectComments } from '@/lib/comments';
import { getAdminPassword } from '@/lib/auth';

interface DeleteRequest {
  adminPassword: string;
}

interface DeleteResponse {
  success: boolean;
  error?: string;
  deletedComments?: number;
}

/**
 * DELETE /api/projects/[id]
 * Deletes a project, its prototype files, and all comments
 * Requires admin password
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body: DeleteRequest = await request.json();
    const { adminPassword } = body;

    // Validate admin password
    if (!adminPassword) {
      return NextResponse.json<DeleteResponse>(
        { success: false, error: 'Admin password is required' },
        { status: 400 }
      );
    }

    try {
      const correctPassword = getAdminPassword();
      if (adminPassword !== correctPassword) {
        return NextResponse.json<DeleteResponse>(
          { success: false, error: 'Invalid admin password' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json<DeleteResponse>(
        { success: false, error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    // Check if project exists
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json<DeleteResponse>(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
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
    const prototypesDir = path.join(process.cwd(), 'public', 'prototypes', projectId);
    try {
      if (fs.existsSync(prototypesDir)) {
        fs.rmSync(prototypesDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Failed to delete prototype files:', error);
      // Continue with deletion even if files fail
    }

    // 3. Remove from database
    const deleted = await deleteProjectFromConfig(projectId);
    if (!deleted) {
      return NextResponse.json<DeleteResponse>(
        { success: false, error: 'Failed to remove project from database' },
        { status: 500 }
      );
    }

    return NextResponse.json<DeleteResponse>({
      success: true,
      deletedComments,
    });

  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json<DeleteResponse>(
      { success: false, error: 'An error occurred while deleting the project' },
      { status: 500 }
    );
  }
}
