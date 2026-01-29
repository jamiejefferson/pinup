import { Project, ProjectVersion } from '@/types';
import { projects, getProject, getAllProjectIds, projectExists } from '@/projects.config';

// Re-export from config for convenience
export { getProject, getAllProjectIds, projectExists };

/**
 * Get all projects
 */
export function getAllProjects(): Project[] {
  return Object.values(projects);
}

/**
 * Get the default version for a project (first version in array)
 */
export function getDefaultVersion(project: Project): ProjectVersion | undefined {
  return project.versions[0];
}

/**
 * Get a specific version from a project
 */
export function getVersion(project: Project, versionId: string): ProjectVersion | undefined {
  return project.versions.find(v => v.id === versionId);
}

/**
 * Get the latest version for a project (last version in array)
 */
export function getLatestVersion(project: Project): ProjectVersion | undefined {
  return project.versions[project.versions.length - 1];
}
