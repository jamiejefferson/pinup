'use client';

import { useState, useEffect, useRef } from 'react';

interface AddCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  elementSelector: string;
  elementText: string;
}

/**
 * Dark themed modal for adding a new comment
 */
export function AddCommentModal({
  isOpen,
  onClose,
  onSubmit,
  elementSelector,
  elementText,
}: AddCommentModalProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setText('');
      setIsSubmitting(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-[#2d2d2d] rounded-lg shadow-2xl w-full max-w-md border border-gray-700"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-sm font-medium text-gray-200">
              Add Comment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Element context */}
          <div className="mb-4 p-3 bg-[#1e1e1e] rounded-md">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Element</p>
            <p className="text-xs text-gray-400 font-mono truncate">
              {elementSelector.length > 60 
                ? elementSelector.slice(0, 60) + '...'
                : elementSelector
              }
            </p>
            {elementText && (
              <>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 mt-2">Text</p>
                <p className="text-xs text-gray-400 italic truncate">
                  &ldquo;{elementText.slice(0, 50)}{elementText.length > 50 ? '...' : ''}&rdquo;
                </p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Textarea */}
            <div className="mb-4">
              <textarea
                id="comment-text"
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's your feedback?"
                rows={4}
                className="w-full px-3 py-2.5 rounded-md border border-gray-600 bg-[#1e1e1e] text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-transparent resize-none text-sm"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-md bg-[#3d3d3d] text-gray-300 text-sm hover:bg-[#454545] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className="flex-1 py-2 px-4 rounded-md bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
