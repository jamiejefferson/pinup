import { NextResponse } from 'next/server';
import { CreateCommentRequest } from '@/types';
import { getSession } from '@/lib/auth';
import { createComment, getComments } from '@/lib/comments';

/**
 * GET /api/comments - Get all comments for a project version
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const versionId = searchParams.get('versionId');

    if (!projectId || !versionId) {
      return NextResponse.json(
        { error: 'projectId and versionId are required' },
        { status: 400 }
      );
    }

    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check project access
    if (session.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    const comments = await getComments(projectId, versionId);
    return NextResponse.json({ comments });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments - Create a new comment
 */
export async function POST(request: Request) {
  try {
    const body: CreateCommentRequest = await request.json();

    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check project access
    if (session.projectId !== body.projectId) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.text || !body.elementSelector) {
      return NextResponse.json(
        { error: 'text and elementSelector are required' },
        { status: 400 }
      );
    }

    const comment = await createComment(
      body,
      session.userName,
      session.userType
    );

    return NextResponse.json({ success: true, comment });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
