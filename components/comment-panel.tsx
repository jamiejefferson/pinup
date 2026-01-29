'use client';

import { useEffect, useRef } from 'react';
import { Comment, UserType } from '@/types';
import { CommentCard } from './comment-card';

interface CommentPanelProps {
  isOpen: boolean;
  comments: Comment[];
  currentUser: { name: string; type: UserType };
  onClose: () => void;
  onDeleteComment: (comment: Comment) => void;
  onExport?: () => void;
  isLoading: boolean;
  highlightedCommentId: string | null;
  onCommentHover: (commentId: string | null) => void;
}

/**
 * Dark comments panel inspired by Figma
 */
export function CommentPanel({
  isOpen,
  comments,
  currentUser,
  onClose,
  onDeleteComment,
  onExport,
  isLoading,
  highlightedCommentId,
  onCommentHover,
}: CommentPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted comment
  useEffect(() => {
    if (highlightedCommentId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedCommentId]);

  // Check if user can delete a comment
  const canDeleteComment = (comment: Comment): boolean => {
    if (currentUser.type === 'admin') return true;
    return comment.authorName === currentUser.name;
  };

  // Check if comment is own
  const isOwnComment = (comment: Comment): boolean => {
    return comment.authorName === currentUser.name;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop Panel */}
      <div
        ref={panelRef}
        className="hidden md:flex flex-col w-72 bg-[#2d2d2d] border-l border-gray-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <span className="text-[11px] text-gray-300 font-medium">
            Comments ({comments.length})
          </span>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-10 h-10 rounded-full bg-[#3d3d3d] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 text-center leading-relaxed">
                Give feedback, ask a question, or just leave a note of appreciation. Click anywhere in the prototype to leave a comment.
              </p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <div
                key={comment.id}
                ref={comment.id === highlightedCommentId ? highlightedRef : null}
              >
                <CommentCard
                  comment={comment}
                  number={index + 1}
                  canDelete={canDeleteComment(comment)}
                  isOwnComment={isOwnComment(comment)}
                  onDelete={() => onDeleteComment(comment)}
                  onHover={() => onCommentHover(comment.id)}
                  onHoverEnd={() => onCommentHover(null)}
                  isHighlighted={comment.id === highlightedCommentId}
                />
              </div>
            ))
          )}
        </div>

        {/* Export Section (Admin only) */}
        {currentUser.type === 'admin' && onExport && comments.length > 0 && (
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={onExport}
              className="w-full bg-[#3d3d3d] hover:bg-[#4d4d4d] text-gray-300 py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Comments
            </button>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${isOpen ? 'block' : 'hidden'}`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />
        
        {/* Panel */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[#2d2d2d] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <span className="text-sm text-gray-300 font-medium">
              Comments ({comments.length})
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-10 h-10 rounded-full bg-[#3d3d3d] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Click on the prototype to add a comment.
                </p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  number={index + 1}
                  canDelete={canDeleteComment(comment)}
                  isOwnComment={isOwnComment(comment)}
                  onDelete={() => onDeleteComment(comment)}
                  onHover={() => {}}
                  onHoverEnd={() => {}}
                  isHighlighted={false}
                />
              ))
            )}
          </div>

          {/* Export Section (Admin only) */}
          {currentUser.type === 'admin' && onExport && comments.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={onExport}
                className="w-full bg-[#3d3d3d] hover:bg-[#4d4d4d] text-gray-300 py-2.5 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Comments
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
