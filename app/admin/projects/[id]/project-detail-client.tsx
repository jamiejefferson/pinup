'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithOwner } from '@/lib/projects-db';

interface ProjectDetailClientProps {
  project: ProjectWithOwner;
}

export function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [clientPassword, setClientPassword] = useState(project.clientPassword);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, clientPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(data.error || 'Failed to update project');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Failed to delete project');
        setShowDeleteConfirm(false);
      }
    } catch {
      setError('An error occurred. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Project Settings */}
      <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Project Settings
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-[var(--radius-md)] transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Client Password
              </label>
              <input
                type="text"
                value={clientPassword}
                onChange={(e) => setClientPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 text-white font-medium rounded-[var(--radius-md)] transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setName(project.name);
                  setClientPassword(project.clientPassword);
                  setError('');
                }}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-[var(--text-secondary)]">Project Name</dt>
              <dd className="text-[var(--text-primary)]">{project.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--text-secondary)]">Project ID</dt>
              <dd className="text-[var(--text-primary)] font-mono">/{project.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--text-secondary)]">Client Password</dt>
              <dd className="text-[var(--text-primary)] font-mono">{project.clientPassword}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--text-secondary)]">Client Login URL</dt>
              <dd className="text-[var(--accent-primary)] font-mono text-sm">
                {typeof window !== 'undefined' ? window.location.origin : ''}/{project.id}/login
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Versions */}
      <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Versions
          </h2>
          <a
            href={`/admin/projects/${project.id}/upload`}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium rounded-[var(--radius-md)] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Version
          </a>
        </div>

        {project.versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)] mb-4">
              No versions uploaded yet.
            </p>
            <a
              href={`/admin/projects/${project.id}/upload`}
              className="inline-flex items-center gap-2 text-[var(--accent-primary)] hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload your first version
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {project.versions.map((version, index) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 bg-[var(--surface-card-alt)] rounded-[var(--radius-md)]"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-semibold rounded-full text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {version.label}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] font-mono">
                      {version.url}
                    </p>
                  </div>
                </div>
                <a
                  href={version.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] rounded-[var(--radius-md)] transition-colors"
                >
                  Preview
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-red-500/20 p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Deleting this project will permanently remove all versions, comments, and uploaded files.
        </p>

        {showDeleteConfirm ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-[var(--radius-md)] transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Project'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium rounded-[var(--radius-md)] transition-colors"
          >
            Delete Project
          </button>
        )}
      </div>
    </div>
  );
}
