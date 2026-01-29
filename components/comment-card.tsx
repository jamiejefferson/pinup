'use client';

import { Comment } from '@/types';

interface CommentCardProps {
  comment: Comment;
  number: number;
  canDelete: boolean;
  isOwnComment: boolean;
  onDelete: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
  isHighlighted: boolean;
}

/**
 * Dark themed comment card
 */
export function CommentCard({
  comment,
  number,
  canDelete,
  isOwnComment,
  onDelete,
  onHover,
  onHoverEnd,
  isHighlighted,
}: CommentCardProps) {
  return (
    <div
      className={`
        bg-[#3d3d3d] rounded-lg p-3
        transition-all duration-200
        ${isHighlighted ? 'ring-1 ring-pink-500' : 'hover:bg-[#454545]'}
      `}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Comment number dot */}
          <div className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
            {number}
          </div>
          
          {/* Author name */}
          <span className="text-sm text-gray-200 font-medium">
            {comment.authorName}
          </span>
          
          {/* "you" badge for own comments */}
          {isOwnComment && (
            <span className="text-[10px] text-gray-500">
              (you)
            </span>
          )}
        </div>

        {/* Delete button */}
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
            aria-label="Delete comment"
            title="Delete comment"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Comment text */}
      <p className="text-sm text-gray-300 leading-relaxed mb-2">
        {comment.text}
      </p>

      {/* Meta info */}
      <div className="flex items-center gap-2 text-[10px] text-gray-500">
        {/* Element selector */}
        <span className="bg-[#2d2d2d] px-1.5 py-0.5 rounded font-mono truncate max-w-[150px]">
          {comment.elementSelector.length > 30 
            ? comment.elementSelector.slice(0, 30) + '...'
            : comment.elementSelector
          }
        </span>
        
        {/* Device type */}
        <span>
          {comment.deviceType === 'mobile' && '📱'}
          {comment.deviceType === 'tablet' && '📟'}
          {comment.deviceType === 'desktop' && '🖥️'}
        </span>
      </div>
    </div>
  );
}
