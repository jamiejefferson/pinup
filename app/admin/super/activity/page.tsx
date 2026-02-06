import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { getAllActivity, getAllAdmins } from '@/lib/admins';
import { Logo } from '@/components/logo';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, string> = {
  login: 'Logged in',
  logout: 'Logged out',
  create_project: 'Created project',
  update_project: 'Updated project',
  delete_project: 'Deleted project',
  upload_version: 'Uploaded version',
  delete_version: 'Deleted version',
  create_admin: 'Created admin',
  update_admin: 'Updated admin',
  delete_admin: 'Deleted admin',
  reset_password: 'Reset password',
};

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-green-500/20 text-green-400',
  logout: 'bg-gray-500/20 text-gray-400',
  create_project: 'bg-blue-500/20 text-blue-400',
  update_project: 'bg-yellow-500/20 text-yellow-400',
  delete_project: 'bg-red-500/20 text-red-400',
  upload_version: 'bg-purple-500/20 text-purple-400',
  delete_version: 'bg-red-500/20 text-red-400',
  create_admin: 'bg-blue-500/20 text-blue-400',
  update_admin: 'bg-yellow-500/20 text-yellow-400',
  delete_admin: 'bg-red-500/20 text-red-400',
  reset_password: 'bg-orange-500/20 text-orange-400',
};

function ActivityDetails({ details }: { details: Record<string, unknown> }) {
  const items: { label: string; value: string }[] = [];

  if (details.projectId) {
    items.push({
      label: 'Project',
      value: String(details.projectName || details.projectId),
    });
  }
  if (details.versionId) {
    items.push({
      label: 'Version',
      value: String(details.versionLabel || details.versionId),
    });
  }
  if (details.newAdminEmail) {
    items.push({
      label: 'New Admin',
      value: String(details.newAdminEmail),
    });
  }
  if (details.targetAdminEmail) {
    items.push({
      label: 'Target',
      value: String(details.targetAdminEmail),
    });
  }
  if (details.deletedAdminEmail) {
    items.push({
      label: 'Deleted',
      value: String(details.deletedAdminEmail),
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 text-xs text-[var(--text-secondary)] space-y-0.5">
      {items.map((item, index) => (
        <p key={index}>
          {item.label}: <span className="font-mono">{item.value}</span>
        </p>
      ))}
    </div>
  );
}

export default async function ActivityPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (!session.isSuperAdmin) {
    redirect('/admin/dashboard');
  }

  const [activity, admins] = await Promise.all([
    getAllActivity(100),
    getAllAdmins(),
  ]);

  // Create a map of admin IDs to names
  const adminNames = new Map(admins.map((a) => [a.id, a.name]));

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
                Activity Log
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Recent admin activity across the system
              </p>
            </div>
          </div>

          <Link
            href="/admin/super"
            className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] transition-colors"
          >
            &larr; Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden">
          {activity.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[var(--text-secondary)]">
                No activity recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {activity.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded font-medium ${
                          ACTION_COLORS[item.action] || 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {ACTION_LABELS[item.action] || item.action}
                      </span>
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">
                          <span className="font-medium">
                            {adminNames.get(item.adminId) || 'Unknown Admin'}
                          </span>
                        </p>
                        {item.details && (
                          <ActivityDetails details={item.details} />
                        )}
                      </div>
                    </div>
                    <time className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
