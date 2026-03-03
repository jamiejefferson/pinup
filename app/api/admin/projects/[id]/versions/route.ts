import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  getProjectById,
  isProjectOwner,
  createVersion,
  getNextVersionId,
} from '@/lib/projects-db';
import { extractPrototype } from '@/lib/uploads';
import { logAdminActivity } from '@/lib/admins';
import { getSupabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'Prototypes';

/**
 * POST /api/admin/projects/[id]/versions - Create a new version
 * Accepts JSON with:
 * - storagePath: Path of the uploaded ZIP in Supabase temp storage
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
    const { storagePath, label } = await request.json();

    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json(
        { error: 'Storage path is required' },
        { status: 400 }
      );
    }

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json(
        { error: 'Version label is required' },
        { status: 400 }
      );
    }

    // Validate the path is in temp-uploads
    if (!storagePath.startsWith('temp-uploads/')) {
      return NextResponse.json(
        { error: 'Invalid storage path' },
        { status: 400 }
      );
    }

    // Download ZIP from Supabase temp storage
    const supabase = getSupabase();
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(storagePath);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to download uploaded file' },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
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

    // Delete temporary upload
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);

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
