'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate project ID from name
  const handleNameChange = (newName: string) => {
    setName(newName);
    // Only auto-generate if user hasn't manually edited the ID
    if (!projectId || projectId === generateSlug(name)) {
      setProjectId(generateSlug(newName));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          name: name.trim(),
          clientPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(`/admin/projects/${data.project.id}`);
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Logo size={40} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Create New Project
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Set up a new prototype for feedback collection
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Project Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Hotel Booking Prototype"
                required
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                A friendly name for your project
              </p>
            </div>

            {/* Project ID */}
            <div>
              <label
                htmlFor="projectId"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Project ID
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-[var(--surface-card-alt)] border border-r-0 border-[var(--border-default)] rounded-l-[var(--radius-md)] text-[var(--text-secondary)] text-sm">
                  /
                </span>
                <input
                  id="projectId"
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="hotel-booking"
                  required
                  pattern="[a-z0-9-]+"
                  minLength={3}
                  maxLength={50}
                  className="flex-1 px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-r-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all font-mono"
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                URL-friendly identifier (lowercase letters, numbers, hyphens only)
              </p>
            </div>

            {/* Client Password */}
            <div>
              <label
                htmlFor="clientPassword"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Client Password
              </label>
              <input
                id="clientPassword"
                type="text"
                value={clientPassword}
                onChange={(e) => setClientPassword(e.target.value)}
                placeholder="review-2025"
                required
                minLength={4}
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Clients will use this password to access the project (at least 4 characters)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] px-3 py-2">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--accent-primary)]/50 text-white font-medium rounded-[var(--radius-md)] transition-colors disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
