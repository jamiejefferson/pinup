'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { DeleteProjectModal } from './delete-project-modal';

interface ProjectListProps {
  initialProjects: Project[];
}

/**
 * Interactive project list with delete functionality
 */
export function ProjectList({ initialProjects }: ProjectListProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleDeleted = () => {
    // Remove the deleted project from the list
    if (projectToDelete) {
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
    }
  };

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--text-secondary)]">
          No projects configured yet.
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Add projects in <code className="bg-[var(--surface-card-alt)] px-1 rounded">data/projects.json</code>
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {projects.map((project) => (
          <li key={project.id} className="group relative">
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
            
            {/* Delete button - appears on hover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setProjectToDelete(project);
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
              title="Delete project"
            >
              <svg 
                className="w-4 h-4 text-gray-400 hover:text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {/* Delete confirmation modal */}
      <DeleteProjectModal
        isOpen={!!projectToDelete}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}
