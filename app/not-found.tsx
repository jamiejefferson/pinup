import Link from 'next/link';
import { Logo } from '@/components/logo';

/**
 * 404 Not Found page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--surface-bg)] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Logo size={64} />
        </div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
          404
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Project not found
        </p>
        <Link
          href="/"
          className="inline-block bg-[var(--action-primary)] text-[var(--action-primary-text)] px-6 py-3 rounded-[var(--radius-md)] font-semibold hover:opacity-90 transition-opacity"
        >
          ← Back to Projects
        </Link>
      </div>
    </div>
  );
}
