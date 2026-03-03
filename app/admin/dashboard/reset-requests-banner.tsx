'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PasswordResetRequest } from '@/types/admin';

export function ResetRequestsBanner({
  requests: initialRequests,
}: {
  requests: PasswordResetRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [dismissing, setDismissing] = useState<string | null>(null);

  async function handleDismiss(requestId: string) {
    setDismissing(requestId);
    try {
      const res = await fetch(
        `/api/admin/super/reset-requests/${requestId}`,
        { method: 'PUT' }
      );
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch {
      // ignore
    } finally {
      setDismissing(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <section className="bg-orange-500/10 border border-orange-500/20 rounded-[var(--radius-lg)] p-5">
      <h2 className="text-lg font-semibold text-orange-400 mb-3">
        Password Reset Requests
      </h2>
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between bg-[var(--surface-card)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-3"
          >
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {req.adminName}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {req.adminEmail} &middot;{' '}
                {new Date(req.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/super/admins/${req.adminId}`}
                className="px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-[var(--radius-md)] transition-colors"
              >
                Reset
              </Link>
              <button
                onClick={() => handleDismiss(req.id)}
                disabled={dismissing === req.id}
                className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
              >
                {dismissing === req.id ? 'Dismissing...' : 'Dismiss'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
