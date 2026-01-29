'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Project, ProjectVersion, Comment, ElementClickData, AuthSession } from '@/types';
import { TopBar } from './top-bar';
import { PrototypeFrame } from './prototype-frame';
import { CommentPanel } from './comment-panel';
import { AddCommentModal } from './add-comment-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

interface ReviewInterfaceProps {
  project: Project;
  currentVersion: ProjectVersion;
  session: AuthSession;
}

/**
 * Main review interface combining all components
 */
export function ReviewInterface({
  project,
  currentVersion,
  session,
}: ReviewInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 1440, height: 900 });
  
  // Modal state
  const [clickData, setClickData] = useState<ElementClickData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteComment, setDeleteComment] = useState<Comment | null>(null);
  
  // Highlighted comment (when hovering in panel)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/comments?projectId=${project.id}&versionId=${currentVersion.id}`
      );
      const data = await response.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id, currentVersion.id]);

  // Load comments on mount and version change
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Track viewport size
  useEffect(() => {
    const updateViewport = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Handle version change
  const handleVersionChange = (versionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('version', versionId);
    router.push(`/${project.id}?${params.toString()}`);
  };

  // Handle element click in prototype
  const handleElementClick = (data: ElementClickData) => {
    setClickData(data);
    setIsAddModalOpen(true);
  };

  // Handle add comment
  const handleAddComment = async (text: string) => {
    if (!clickData) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          versionId: currentVersion.id,
          text,
          elementSelector: clickData.selector,
          elementText: clickData.elementText,
          clickX: clickData.clickX,
          clickY: clickData.clickY,
          viewportWidth: clickData.viewportWidth,
          viewportHeight: clickData.viewportHeight,
        }),
      });

      if (response.ok) {
        await fetchComments();
        setIsAddModalOpen(false);
        setClickData(null);
        // Auto-open panel after adding comment
        setIsPanelOpen(true);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (id: string) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchComments();
        setDeleteComment(null);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Handle export - downloads as a dated markdown file
  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/export?projectId=${project.id}&versionId=${currentVersion.id}`
      );
      const text = await response.text();
      
      // Generate dated filename
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `pinup-${project.id}-${currentVersion.id}-${date}.md`;
      
      // Create blob and download link
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export comments');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push(`/${project.id}/login`);
      router.refresh();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Handle dot click - scroll to comment in panel
  const handleDotClick = (commentId: string) => {
    setHighlightedCommentId(commentId);
    if (!isPanelOpen) {
      setIsPanelOpen(true);
    }
    // Clear highlight after animation
    setTimeout(() => setHighlightedCommentId(null), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a]">
      {/* Top Bar */}
      <TopBar
        projectName={project.name}
        versions={project.versions}
        currentVersionId={currentVersion.id}
        onVersionChange={handleVersionChange}
        viewportWidth={viewportSize.width}
        viewportHeight={viewportSize.height}
        commentCount={comments.length}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
        userType={session.userType}
        onExport={session.userType === 'admin' ? handleExport : undefined}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Prototype Frame */}
        <PrototypeFrame
          url={currentVersion.url}
          onElementClick={handleElementClick}
          showDots={isPanelOpen}
          comments={comments}
          onDotClick={handleDotClick}
        />

        {/* Comment Panel */}
        <CommentPanel
          isOpen={isPanelOpen}
          comments={comments}
          currentUser={{ name: session.userName, type: session.userType }}
          onClose={() => setIsPanelOpen(false)}
          onDeleteComment={(comment) => setDeleteComment(comment)}
          onExport={session.userType === 'admin' ? handleExport : undefined}
          isLoading={isLoading}
          highlightedCommentId={highlightedCommentId}
          onCommentHover={setHighlightedCommentId}
        />
      </div>

      {/* Add Comment Modal */}
      <AddCommentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setClickData(null);
        }}
        onSubmit={handleAddComment}
        elementSelector={clickData?.selector || ''}
        elementText={clickData?.elementText || ''}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteComment}
        comment={deleteComment}
        onClose={() => setDeleteComment(null)}
        onConfirm={() => deleteComment && handleDeleteComment(deleteComment.id)}
      />
    </div>
  );
}
