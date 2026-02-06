import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { getProjectById } from '@/lib/projects-db';
import { Logo } from '@/components/logo';
import { ProjectDetailClient } from './project-detail-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  const { id: projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  // Check ownership (super admins can access any project)
  if (!session.isSuperAdmin && project.ownerId !== session.adminId) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Logo size={40} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                {project.name}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] font-mono">
                /{project.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${project.id}/login`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Project
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ProjectDetailClient project={project} />
      </main>
    </div>
  );
}
