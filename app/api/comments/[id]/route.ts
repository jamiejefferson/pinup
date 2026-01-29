import { NextResponse } from 'next/server';
import { getSession, canDeleteComment } from '@/lib/auth';
import { getComment, deleteComment } from '@/lib/comments';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/comments/[id] - Delete a comment
 */
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the comment to verify ownership
    const comment = await getComment(id);
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check project access
    if (session.projectId !== comment.projectId) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    // Check if user can delete this comment
    if (!canDeleteComment(session, comment.authorName)) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    const success = await deleteComment(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
