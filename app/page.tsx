import { getAllProjects } from '@/lib/projects';
import { Logo } from '@/components/logo';
import { ProjectList } from '@/components/project-list';

// Force dynamic rendering so new projects appear immediately
export const dynamic = 'force-dynamic';

/**
 * Root landing page - shows available projects
 * In production, this could redirect to a specific project or show a project selector
 */
export default function HomePage() {
  const projects = getAllProjects();

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={80} />
          </div>
          <p className="text-[var(--text-secondary)] mt-2">
            Prototype Review Platform
          </p>
        </div>

        {/* Project List */}
        <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] shadow-lg border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-card-alt)]">
            <h2 className="font-semibold text-[var(--text-primary)]">
              Your Prototypes
            </h2>
          </div>

          <ProjectList initialProjects={projects} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Pin contextual feedback on design prototypes
        </p>
      </div>

      {/* Equator Logo Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <img 
          src="/equator-logo.png" 
          alt="Equator" 
          className="h-4 opacity-40"
        />
      </div>
    </div>
  );
}
