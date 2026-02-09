'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';

const ALLOWED_DOMAIN = 'eqtr.com';

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain === ALLOWED_DOMAIN;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email domain
    if (!validateEmail(email)) {
      setError(`Only @${ALLOWED_DOMAIN} email addresses are allowed`);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Auto-login after signup
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Sign up failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={80} />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Join PinUp
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            Create your account to start managing prototypes
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] shadow-lg border border-[var(--border-subtle)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoComplete="name"
                autoFocus
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`you@${ALLOWED_DOMAIN}`}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Must be an @{ALLOWED_DOMAIN} address
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--accent-primary)]/50 text-white font-medium rounded-[var(--radius-md)] transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Already have an account?{' '}
          <Link
            href="/admin/login"
            className="text-[var(--accent-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>

        {/* Back Link */}
        <p className="text-center text-sm text-[var(--text-secondary)] mt-2">
          <Link href="/" className="hover:text-[var(--accent-primary)] transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
