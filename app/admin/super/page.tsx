import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { getAllAdmins, getAllActivity } from '@/lib/admins';
import { getAllProjects } from '@/lib/projects-db';
import { Logo } from '@/components/logo';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (!session.isSuperAdmin) {
    redirect('/admin/dashboard');
  }

  const [admins, projects, recentActivity] = await Promise.all([
    getAllAdmins(),
    getAllProjects(),
    getAllActivity(10),
  ]);

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Logo size={40} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                Super Admin
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Manage all admins and view system activity
              </p>
            </div>
          </div>

          <Link
            href="/admin/dashboard"
            className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-5">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {admins.length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Total Admins</div>
          </div>
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-5">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {projects.length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Total Projects</div>
          </div>
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-5">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {admins.filter((a) => a.isSuperAdmin).length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Super Admins</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Admins Section */}
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">Admins</h2>
              <Link
                href="/admin/super/admins/new"
                className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium rounded-[var(--radius-md)] transition-colors"
              >
                + Add Admin
              </Link>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {admins.slice(0, 5).map((admin) => (
                <Link
                  key={admin.id}
                  href={`/admin/super/admins/${admin.id}`}
                  className="block p-4 hover:bg-[var(--surface-card-alt)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {admin.name}
                        {admin.isSuperAdmin && (
                          <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            Super
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {admin.email}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        admin.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {admins.length > 5 && (
              <div className="p-4 border-t border-[var(--border-subtle)]">
                <Link
                  href="/admin/super/admins"
                  className="text-sm text-[var(--accent-primary)] hover:underline"
                >
                  View all {admins.length} admins &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity Section */}
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">
                Recent Activity
              </h2>
              <Link
                href="/admin/super/activity"
                className="text-sm text-[var(--accent-primary)] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">
                  No activity recorded yet.
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-[var(--surface-card-alt)] text-[var(--text-secondary)] text-xs rounded font-mono">
                        {activity.action}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                        {JSON.stringify(activity.details).slice(0, 50)}...
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
