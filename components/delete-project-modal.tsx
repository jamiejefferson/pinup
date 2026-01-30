'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/types';

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onDeleted: () => void;
}

/**
 * Dark themed confirmation dialog for deleting a project
 * Requires admin password to confirm deletion
 */
export function DeleteProjectModal({
  isOpen,
  project,
  onClose,
  onDeleted,
}: DeleteProjectModalProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setAdminPassword('');
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onClose]);

  const handleDelete = async () => {
    if (!project || !adminPassword.trim()) {
      setError('Admin password is required');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete project');
        setIsDeleting(false);
        return;
      }

      // Success - notify parent and close
      onDeleted();
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
      setError('An error occurred while deleting the project');
      setIsDeleting(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={isDeleting ? undefined : onClose}
      />

      {/* Dialog */}
      <div 
        className="relative bg-[#2d2d2d] rounded-lg shadow-2xl w-full max-w-md border border-gray-700"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 id="dialog-title" className="text-sm font-medium text-gray-200">
                Delete project?
              </h2>
              <p className="text-xs text-gray-500">This action cannot be undone</p>
            </div>
          </div>

          {/* Project info */}
          <div className="bg-[#1e1e1e] rounded-md p-3 mb-4">
            <p className="text-sm font-medium text-gray-200 mb-1">
              {project.name}
            </p>
            <p className="text-xs text-gray-500">
              {project.versions.length} version{project.versions.length !== 1 ? 's' : ''} will be deleted
            </p>
          </div>

          {/* Warning */}
          <div className="text-xs text-gray-400 mb-4 space-y-1">
            <p>This will permanently delete:</p>
            <ul className="list-disc list-inside text-gray-500 ml-2">
              <li>All prototype files</li>
              <li>All comments and feedback</li>
              <li>Project configuration</li>
            </ul>
          </div>

          {/* Admin password field */}
          <div className="mb-4">
            <label htmlFor="admin-password" className="block text-xs text-gray-400 mb-1.5">
              Enter admin password to confirm
            </label>
            <input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              disabled={isDeleting}
              placeholder="Admin password"
              className="w-full px-3 py-2 bg-[#1e1e1e] border border-gray-700 rounded-md text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 disabled:opacity-50"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isDeleting) {
                  handleDelete();
                }
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded-md">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

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
              onClick={handleDelete}
              disabled={isDeleting || !adminPassword.trim()}
              className="flex-1 py-2 px-4 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
