import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getAdminSession } from '@/lib/auth';
import {
  getProjectById,
  isProjectOwner,
  createVersion,
  getNextVersionId,
} from '@/lib/projects-db';
import { extractPrototype } from '@/lib/uploads';
import { logAdminActivity } from '@/lib/admins';

/**
 * POST /api/admin/projects/[id]/versions - Create a new version
 * Accepts JSON with:
 * - blobUrl: URL of the uploaded ZIP in Vercel Blob storage
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

    // Parse JSON body
    const { blobUrl, label } = await request.json();

    if (!blobUrl || typeof blobUrl !== 'string') {
      return NextResponse.json(
        { error: 'Blob URL is required' },
        { status: 400 }
      );
    }

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json(
        { error: 'Version label is required' },
        { status: 400 }
      );
    }

    // Validate blob URL origin
    try {
      const url = new URL(blobUrl);
      if (!url.hostname.endsWith('.public.blob.vercel-storage.com')) {
        return NextResponse.json(
          { error: 'Invalid blob URL' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid blob URL' },
        { status: 400 }
      );
    }

    // Download ZIP from blob storage
    const blobResponse = await fetch(blobUrl);
    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download uploaded file' },
        { status: 400 }
      );
    }

    const arrayBuffer = await blobResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get the next version ID
    const versionId = await getNextVersionId(projectId);

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

    // Delete temporary blob
    try {
      await del(blobUrl);
    } catch {
      // Non-critical: blob will expire on its own
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
