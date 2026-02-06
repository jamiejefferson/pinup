import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { getAllAdmins } from '@/lib/admins';
import { Logo } from '@/components/logo';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminsListPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (!session.isSuperAdmin) {
    redirect('/admin/dashboard');
  }

  const admins = await getAllAdmins();

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/super">
              <Logo size={40} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                All Admins
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {admins.length} admin{admins.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>

          <Link
            href="/admin/super/admins/new"
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium rounded-[var(--radius-md)] transition-colors"
          >
            + Add Admin
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {admins.map((admin) => (
              <Link
                key={admin.id}
                href={`/admin/super/admins/${admin.id}`}
                className="block p-4 hover:bg-[var(--surface-card-alt)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center">
                      <span className="text-[var(--accent-primary)] font-semibold">
                        {admin.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {admin.name}
                        {admin.isSuperAdmin && (
                          <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            Super Admin
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {admin.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        admin.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {admin.lastLoginAt
                        ? `Last login: ${new Date(admin.lastLoginAt).toLocaleDateString()}`
                        : 'Never logged in'}
                    </span>
                    <svg
                      className="w-5 h-5 text-[var(--text-secondary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
