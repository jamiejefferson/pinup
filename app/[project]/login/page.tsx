'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.project as string;

  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, password, name }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/${projectId}`);
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg-inverse)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size={64} variant="light" />
          </div>
          <p className="text-gray-400 mt-1">Prototype Review</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 rounded-[var(--radius-lg)] shadow-lg p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[var(--text-inverse)] mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter review password"
                required
                className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-gray-600 bg-gray-800 text-[var(--text-inverse)] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--action-primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Name Field */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-[var(--text-inverse)] mb-2"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we identify you?"
                required
                minLength={2}
                className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-gray-600 bg-gray-800 text-[var(--text-inverse)] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--action-primary)] focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                This will appear on your comments
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[var(--status-error)]/20 text-[var(--status-error)] px-4 py-3 rounded-[var(--radius-md)] text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--action-primary)] text-[var(--action-primary-text)] py-3 px-6 rounded-[var(--radius-md)] font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--action-primary)] focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Enter Review →'
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Equator Logo Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <img 
          src="/equator-logo-white.png" 
          alt="Equator" 
          className="h-4 opacity-40"
        />
      </div>
    </div>
  );
}
