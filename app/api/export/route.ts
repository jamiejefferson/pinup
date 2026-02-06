import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getComments } from '@/lib/comments';
import { getProject, getVersion } from '@/lib/projects';
import { Comment } from '@/types';

/**
 * Generate a suggested action based on the comment and element
 */
function generateSuggestedAction(comment: Comment): string {
  const selector = comment.elementSelector.toLowerCase();
  const text = comment.text.toLowerCase();

  // Analyze the element type
  if (selector.includes('button') || selector.includes('btn') || selector.includes('cta')) {
    if (text.includes('small') || text.includes('tap') || text.includes('click')) {
      return `Increase tap target for ${comment.elementSelector} on ${comment.deviceType}. Minimum 44x44px recommended.`;
    }
    return `Review button styling/behavior for ${comment.elementSelector}.`;
  }

  if (selector.includes('h1') || selector.includes('h2') || selector.includes('h3') || selector.includes('title') || selector.includes('heading')) {
    if (text.includes('generic') || text.includes('specific') || text.includes('change')) {
      return `Update heading text in ${comment.elementSelector} to be more specific/compelling.`;
    }
    return `Review heading content in ${comment.elementSelector}.`;
  }

  if (selector.includes('input') || selector.includes('form') || selector.includes('field')) {
    return `Review form field behavior/validation for ${comment.elementSelector}.`;
  }

  if (selector.includes('card')) {
    if (text.includes('hover') || text.includes('effect') || text.includes('animation')) {
      return `Add hover state/interaction to ${comment.elementSelector}.`;
    }
    return `Review card component styling at ${comment.elementSelector}.`;
  }

  if (selector.includes('nav') || selector.includes('menu') || selector.includes('header')) {
    return `Review navigation element at ${comment.elementSelector}.`;
  }

  if (selector.includes('img') || selector.includes('image') || selector.includes('photo')) {
    return `Review image element at ${comment.elementSelector}.`;
  }

  // Default action
  return `Review element at ${comment.elementSelector} based on feedback.`;
}

/**
 * GET /api/export - Export comments as Cursor-ready markdown (admin only)
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

    // Check admin access
    if (session.userType !== 'admin') {
      return NextResponse.json(
        { error: 'Export is only available to admins' },
        { status: 403 }
      );
    }

    // Check project access
    if (session.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    // Get project and version info
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const version = getVersion(project, versionId);
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Get comments
    const comments = await getComments(projectId, versionId);

    // Generate markdown
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    
    let markdown = `## PinUp Feedback Export
**Project:** ${project.name}
**Version:** ${version.label}
**Exported:** ${now}
**Comments:** ${comments.length} items

---

`;

    if (comments.length === 0) {
      markdown += `*No comments for this version.*

`;
    } else {
      comments.forEach((comment, index) => {
        markdown += `### 📌 Comment #${index + 1}
**Element:** \`${comment.elementSelector}\`
`;

        if (comment.elementText) {
          markdown += `**Element Text:** "${comment.elementText}"
`;
        }

        markdown += `**Viewport:** ${comment.deviceType.charAt(0).toUpperCase() + comment.deviceType.slice(1)} (${comment.viewportWidth}px)
**Author:** ${comment.authorName}

**Feedback:**
"${comment.text}"

**Suggested action:**
${generateSuggestedAction(comment)}

---

`;
      });
    }

    markdown += `*Exported from PinUp*`;

    // Return as plain text
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error exporting comments:', error);
    return NextResponse.json(
      { error: 'Failed to export comments' },
      { status: 500 }
    );
  }
}
