'use client';

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function UploadVersionPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.zip')) {
      setError('Please select a ZIP file');
      return;
    }

    // 50MB limit
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Auto-generate label if empty
    if (!label) {
      const baseName = selectedFile.name.replace('.zip', '');
      setLabel(baseName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a ZIP file');
      return;
    }

    if (!label.trim()) {
      setError('Please enter a version label');
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', label.trim());

      setUploadProgress(30);

      const response = await fetch(`/api/admin/projects/${projectId}/versions`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadProgress(100);
        router.push(`/admin/projects/${projectId}`);
      } else {
        setError(data.error || 'Failed to upload version');
        setUploadProgress(0);
      }
    } catch {
      setError('An error occurred. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/admin/projects/${projectId}`}>
            <Logo size={40} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Upload New Version
            </h1>
            <p className="text-sm text-[var(--text-secondary)] font-mono">
              /{projectId}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Drop Zone */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Prototype ZIP File
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : 'border-[var(--border-default)] hover:border-[var(--accent-primary)]/50'
                  }
                  ${file ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      handleFileSelect(selectedFile);
                    }
                  }}
                  className="sr-only"
                />

                {file ? (
                  <div>
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-[var(--accent-primary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-medium text-[var(--text-primary)]">
                      {file.name}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-[var(--accent-primary)] mt-2">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-[var(--text-secondary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="font-medium text-[var(--text-primary)]">
                      Drop your ZIP file here
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      or click to browse
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-3">
                      ZIP must contain an index.html file (max 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Version Label */}
            <div>
              <label
                htmlFor="label"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Version Label
              </label>
              <input
                id="label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="V1 - Initial Concept"
                required
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                A descriptive label for this version (e.g., &quot;V2 - Post-feedback&quot;)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] px-3 py-2">
                {error}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Uploading...</span>
                  <span className="text-[var(--text-primary)]">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-[var(--surface-card-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <Link
                href={`/admin/projects/${projectId}`}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isUploading || !file}
                className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--accent-primary)]/50 text-white font-medium rounded-[var(--radius-md)] transition-colors disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Version
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
          <h3 className="font-medium text-[var(--text-primary)] mb-2">
            ZIP File Requirements
          </h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
            <li>Must contain an <code className="text-[var(--accent-primary)]">index.html</code> file at the root</li>
            <li>All assets (CSS, JS, images) should use relative paths</li>
            <li>Allowed file types: HTML, CSS, JS, images, fonts, video, audio</li>
            <li>Maximum file size: 50MB</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
