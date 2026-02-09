import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { getProjectsByOwner, getAllProjects } from '@/lib/projects-db';
import { getAllAdmins } from '@/lib/admins';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Admin } from '@/types/admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Generate initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a consistent color based on name
 */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-pink-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Team member row component
 */
function TeamMemberRow({ admin, currentAdminId }: { admin: Admin; currentAdminId: string }) {
  const initials = getInitials(admin.name);
  const avatarColor = getAvatarColor(admin.name);
  const isCurrentUser = admin.id === currentAdminId;
  
  return (
    <div className="flex items-center justify-between p-3 hover:bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text-primary)]">
              {admin.name}
            </span>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs rounded">
                You
              </span>
            )}
            {admin.isSuperAdmin && (
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                Super Admin
              </span>
            )}
            {!admin.isActive && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{admin.email}</p>
        </div>
      </div>
      <Link
        href={`/admin/super/admins/${admin.id}`}
        className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] rounded-[var(--radius-md)] transition-colors"
      >
        Edit
      </Link>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  // Super admins see all projects, regular admins see only their own
  const projects = session.isSuperAdmin
    ? await getAllProjects()
    : await getProjectsByOwner(session.adminId);

  // Super admins can see all team members
  const teamMembers = session.isSuperAdmin ? await getAllAdmins() : [];

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo size={40} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                Dashboard
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Welcome, {session.name}
                {session.isSuperAdmin && (
                  <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                    Super Admin
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/projects/new"
              className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium rounded-[var(--radius-md)] transition-colors"
            >
              + New Project
            </Link>
            <form action="/api/admin/auth/logout" method="POST">
              <button
                type="submit"
                className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Projects Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {session.isSuperAdmin ? 'All Projects' : 'Your Projects'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-card-alt)] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--text-secondary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No projects yet
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                Create your first project to start collecting feedback on your prototypes.
              </p>
              <Link
                href="/admin/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-medium rounded-[var(--radius-md)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-5 hover:border-[var(--accent-primary)] transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors"
                    >
                      {project.name}
                    </Link>
                    <span className="px-2 py-0.5 bg-[var(--surface-card-alt)] text-[var(--text-secondary)] text-xs rounded">
                      {project.versions.length} version{project.versions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3 font-mono">
                    /{project.id}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      {project.clientPassword.slice(0, 3)}***
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/${project.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded transition-colors"
                      >
                        View
                      </a>
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)] rounded transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Team Members Section (Super Admin Only) */}
        {session.isSuperAdmin && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Team Members
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {teamMembers.length} user{teamMembers.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Link
                href="/admin/super/admins/new"
                className="px-4 py-2 bg-[var(--surface-card)] hover:bg-[var(--surface-card-alt)] text-[var(--text-primary)] text-sm font-medium rounded-[var(--radius-md)] border border-[var(--border-subtle)] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add User
              </Link>
            </div>

            <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
              {teamMembers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[var(--text-secondary)]">
                    No team members yet
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {teamMembers.map((admin) => (
                    <TeamMemberRow
                      key={admin.id}
                      admin={admin}
                      currentAdminId={session.adminId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log Link */}
            <div className="mt-4 text-center">
              <Link
                href="/admin/super/activity"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                View activity log →
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
