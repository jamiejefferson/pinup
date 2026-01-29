import Link from 'next/link';
import { getAllProjects } from '@/lib/projects';
import { Logo } from '@/components/logo';

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
              Available Projects
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[var(--text-secondary)]">
                No projects configured yet.
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Add projects in <code className="bg-[var(--surface-card-alt)] px-1 rounded">projects.config.ts</code>
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/${project.id}/login`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-card-alt)] transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {project.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {project.versions.length} version{project.versions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-[var(--action-primary)]">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
