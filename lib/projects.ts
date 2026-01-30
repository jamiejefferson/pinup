import 'server-only';
import { Project, ProjectVersion, ProjectsConfig } from '@/types';
import fs from 'fs';
import path from 'path';

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');

/**
 * Read projects from JSON file
 */
function readProjectsFromFile(): ProjectsConfig {
  try {
    const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data) as ProjectsConfig;
  } catch (error) {
    console.error('Failed to read projects file:', error);
    return {};
  }
}

/**
 * Write projects to JSON file
 */
export function saveProjects(projects: ProjectsConfig): void {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write projects file:', error);
    throw new Error('Failed to save projects');
  }
}

/**
 * Get all projects as a config object
 */
export function getProjectsConfig(): ProjectsConfig {
  return readProjectsFromFile();
}

/**
 * Get all projects as an array
 */
export function getAllProjects(): Project[] {
  const projects = readProjectsFromFile();
  return Object.values(projects);
}

/**
 * Get a project by its ID
 */
export function getProject(projectId: string): Project | undefined {
  const projects = readProjectsFromFile();
  return projects[projectId];
}

/**
 * Get all project IDs
 */
export function getAllProjectIds(): string[] {
  const projects = readProjectsFromFile();
  return Object.keys(projects);
}

/**
 * Check if a project exists
 */
export function projectExists(projectId: string): boolean {
  const projects = readProjectsFromFile();
  return projectId in projects;
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

/**
 * Delete a project from the config
 */
export function deleteProjectFromConfig(projectId: string): boolean {
  const projects = readProjectsFromFile();
  
  if (!(projectId in projects)) {
    return false;
  }
  
  delete projects[projectId];
  saveProjects(projects);
  return true;
}

/**
 * Add a new project to the config
 */
export function addProject(project: Project): void {
  const projects = readProjectsFromFile();
  projects[project.id] = project;
  saveProjects(projects);
}
