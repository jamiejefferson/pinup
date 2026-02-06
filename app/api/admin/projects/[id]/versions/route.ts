import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  getProjectById,
  isProjectOwner,
  createVersion,
  getNextVersionId,
} from '@/lib/projects-db';
import { extractPrototype, validateFileSize } from '@/lib/uploads';
import { logAdminActivity } from '@/lib/admins';

/**
 * POST /api/admin/projects/[id]/versions - Upload a new version
 * Accepts multipart form data with:
 * - file: ZIP file containing the prototype
 * - label: Version label (e.g., "V1 - Initial Concept")
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project exists and check ownership
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check ownership (super admins can upload to any project)
    if (!session.isSuperAdmin) {
      const isOwner = await isProjectOwner(projectId, session.adminId);
      if (!isOwner) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const label = formData.get('label') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'ZIP file is required' },
        { status: 400 }
      );
    }

    if (!label || label.trim().length === 0) {
      return NextResponse.json(
        { error: 'Version label is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'File must be a ZIP archive' },
        { status: 400 }
      );
    }

    // Validate file size
    try {
      validateFileSize(file.size);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'File too large' },
        { status: 400 }
      );
    }

    // Get the next version ID
    const versionId = await getNextVersionId(projectId);

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract the ZIP
    let result: { url: string; fileCount: number };
    try {
      result = await extractPrototype(buffer, projectId, versionId);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to extract ZIP file',
        },
        { status: 400 }
      );
    }

    // Create the version record
    const version = await createVersion(projectId, {
      id: versionId,
      label: label.trim(),
      url: result.url,
    });

    // Log the activity
    await logAdminActivity(session.adminId, 'upload_version', {
      projectId,
      versionId: version.id,
      versionLabel: version.label,
      fileCount: result.fileCount,
    });

    return NextResponse.json(
      {
        success: true,
        version,
        fileCount: result.fileCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading version:', error);
    return NextResponse.json(
      { error: 'Failed to upload version' },
      { status: 500 }
    );
  }
}
