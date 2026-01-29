'use client';

import { useEffect, useState } from 'react';
import { Comment } from '@/types';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  comment: Comment | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Dark themed confirmation dialog for deleting a comment
 */
export function DeleteConfirmDialog({
  isOpen,
  comment,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !comment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Dialog */}
      <div 
        className="relative bg-[#2d2d2d] rounded-lg shadow-2xl w-full max-w-sm border border-gray-700"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 id="dialog-title" className="text-sm font-medium text-gray-200">
                Delete comment?
              </h2>
              <p className="text-xs text-gray-500">This cannot be undone</p>
            </div>
          </div>

          {/* Comment preview */}
          <div className="bg-[#1e1e1e] rounded-md p-3 mb-4">
            <p className="text-sm text-gray-300 mb-2 leading-relaxed">
              &ldquo;{comment.text.length > 80 
                ? comment.text.slice(0, 80) + '...'
                : comment.text
              }&rdquo;
            </p>
            <p className="text-xs text-gray-500">
              — {comment.authorName}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2 px-4 rounded-md bg-[#3d3d3d] text-gray-300 text-sm hover:bg-[#454545] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 py-2 px-4 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
