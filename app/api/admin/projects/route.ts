import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  createProject,
  getProjectsByOwner,
  getAllProjects,
} from '@/lib/projects-db';
import { logAdminActivity } from '@/lib/admins';

interface CreateProjectRequest {
  id: string;
  name: string;
  clientPassword: string;
}

/**
 * GET /api/admin/projects - List projects for the current admin
 */
export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Super admins see all projects, regular admins see only their own
    const projects = session.isSuperAdmin
      ? await getAllProjects()
      : await getProjectsByOwner(session.adminId);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/projects - Create a new project
 */
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateProjectRequest = await request.json();
    const { id, name, clientPassword } = body;

    // Validate required fields
    if (!id || !name || !clientPassword) {
      return NextResponse.json(
        { error: 'Project ID, name, and client password are required' },
        { status: 400 }
      );
    }

    // Validate project ID format
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: 'Project ID must only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Validate ID length
    if (id.length < 3 || id.length > 50) {
      return NextResponse.json(
        { error: 'Project ID must be between 3 and 50 characters' },
        { status: 400 }
      );
    }

    // Validate client password length
    if (clientPassword.length < 4) {
      return NextResponse.json(
        { error: 'Client password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Create the project
    const project = await createProject({
      id,
      name: name.trim(),
      clientPassword,
      ownerId: session.adminId,
    });

    // Log the activity
    await logAdminActivity(session.adminId, 'create_project', {
      projectId: project.id,
      projectName: project.name,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'A project with this ID already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
