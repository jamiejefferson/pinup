'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Admin } from '@/types/admin';
import { ProjectWithOwner } from '@/lib/projects-db';

interface AdminEditClientProps {
  admin: Admin;
  projects: ProjectWithOwner[];
  currentAdminId: string;
}

export function AdminEditClient({
  admin,
  projects,
  currentAdminId,
}: AdminEditClientProps) {
  const router = useRouter();
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [isActive, setIsActive] = useState(admin.isActive);
  const [isSuperAdmin, setIsSuperAdmin] = useState(admin.isSuperAdmin);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSelf = admin.id === currentAdminId;

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/super/admins/${admin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          isActive,
          isSuperAdmin,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.refresh();
        setNewPassword('');
      } else {
        setError(data.error || 'Failed to update admin');
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
      const response = await fetch(`/api/admin/super/admins/${admin.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/admin/super/admins');
      } else {
        setError(data.error || 'Failed to delete admin');
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
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/super/admins">
            <Logo size={40} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Edit Admin
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">{admin.email}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Admin Details */}
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Account Details
          </h2>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
              {newPassword && newPassword.length < 8 && (
                <p className="text-xs text-red-400 mt-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSelf}
                  className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--input-bg)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] disabled:opacity-50"
                />
                <label
                  htmlFor="isActive"
                  className={`text-sm ${isSelf ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
                >
                  Account active
                  {isSelf && ' (cannot deactivate yourself)'}
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isSuperAdmin"
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  disabled={isSelf}
                  className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--input-bg)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] disabled:opacity-50"
                />
                <label
                  htmlFor="isSuperAdmin"
                  className={`text-sm ${isSelf ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
                >
                  Super admin privileges
                  {isSelf && ' (cannot demote yourself)'}
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving || (newPassword.length > 0 && newPassword.length < 8)}
                className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 text-white font-medium rounded-[var(--radius-md)] transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Projects ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <p className="text-[var(--text-secondary)]">
              This admin hasn&apos;t created any projects yet.
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-[var(--surface-card-alt)] rounded-[var(--radius-md)]"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {project.name}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] font-mono">
                      /{project.id}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-[var(--surface-card)] text-[var(--text-secondary)] text-xs rounded">
                    {project.versions.length} version{project.versions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        {!isSelf && (
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-red-500/20 p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Deleting this admin will remove their account. Their projects will remain but
              will need to be reassigned.
            </p>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-[var(--radius-md)] transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Admin'}
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
                Delete Admin
              </button>
            )}
          </div>
        )}

        {/* Account Info */}
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Account Info
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--text-secondary)]">Created</dt>
              <dd className="text-[var(--text-primary)]">
                {new Date(admin.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-secondary)]">Last Login</dt>
              <dd className="text-[var(--text-primary)]">
                {admin.lastLoginAt
                  ? new Date(admin.lastLoginAt).toLocaleDateString()
                  : 'Never'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-secondary)]">Admin ID</dt>
              <dd className="text-[var(--text-primary)] font-mono text-xs">
                {admin.id}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
