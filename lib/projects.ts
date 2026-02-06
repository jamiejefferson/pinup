import 'server-only';
import { Project, ProjectVersion, ProjectsConfig } from '@/types';
import { getSupabase } from './supabase';

/**
 * Database row types (snake_case)
 */
interface ProjectRow {
  id: string;
  name: string;
  client_password: string;
  owner_id: string;
  created_at: string;
}

interface ProjectVersionRow {
  id: string;
  project_id: string;
  label: string;
  url: string;
  created_at: string;
}

/**
 * Get all projects as an array (from database)
 */
export async function getAllProjects(): Promise<Project[]> {
  const supabase = getSupabase();

  // Get all projects
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Failed to fetch projects:', projectsError);
    return [];
  }

  if (!projectsData || projectsData.length === 0) {
    return [];
  }

  // Get all versions
  const { data: versionsData, error: versionsError } = await supabase
    .from('project_versions')
    .select('*')
    .order('created_at', { ascending: true });

  if (versionsError) {
    console.error('Failed to fetch versions:', versionsError);
    return [];
  }

  // Group versions by project
  const versionsByProject = new Map<string, ProjectVersionRow[]>();
  for (const version of versionsData as ProjectVersionRow[]) {
    const existing = versionsByProject.get(version.project_id) || [];
    existing.push(version);
    versionsByProject.set(version.project_id, existing);
  }

  // Build project objects
  return (projectsData as ProjectRow[]).map((project) => ({
    id: project.id,
    name: project.name,
    clientPassword: project.client_password,
    versions: (versionsByProject.get(project.id) || []).map((v) => ({
      id: v.id,
      label: v.label,
      url: v.url,
    })),
  }));
}

/**
 * Get all projects as a config object (from database)
 */
export async function getProjectsConfig(): Promise<ProjectsConfig> {
  const projects = await getAllProjects();
  const config: ProjectsConfig = {};
  for (const project of projects) {
    config[project.id] = project;
  }
  return config;
}

/**
 * Get a project by its ID (from database)
 */
export async function getProject(projectId: string): Promise<Project | undefined> {
  const supabase = getSupabase();

  // Get project
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    if (projectError.code === 'PGRST116') {
      return undefined;
    }
    console.error('Failed to fetch project:', projectError);
    return undefined;
  }

  // Get versions
  const { data: versionsData, error: versionsError } = await supabase
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (versionsError) {
    console.error('Failed to fetch versions:', versionsError);
    return undefined;
  }

  const project = projectData as ProjectRow;
  return {
    id: project.id,
    name: project.name,
    clientPassword: project.client_password,
    versions: (versionsData as ProjectVersionRow[]).map((v) => ({
      id: v.id,
      label: v.label,
      url: v.url,
    })),
  };
}

/**
 * Get all project IDs
 */
export async function getAllProjectIds(): Promise<string[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.from('projects').select('id');

  if (error) {
    console.error('Failed to fetch project IDs:', error);
    return [];
  }

  return (data || []).map((row) => (row as { id: string }).id);
}

/**
 * Check if a project exists
 */
export async function projectExists(projectId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('id', projectId);

  if (error) {
    console.error('Failed to check project existence:', error);
    return false;
  }

  return (count ?? 0) > 0;
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
  return project.versions.find((v) => v.id === versionId);
}

/**
 * Get the latest version for a project (last version in array)
 */
export function getLatestVersion(project: Project): ProjectVersion | undefined {
  return project.versions[project.versions.length - 1];
}

/**
 * Delete a project from the database
 */
export async function deleteProjectFromConfig(projectId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase.from('projects').delete().eq('id', projectId);

  if (error) {
    console.error('Failed to delete project:', error);
    return false;
  }

  return true;
}

/**
 * Add a new project to the database
 * Note: This requires an owner_id, which should be set via the admin APIs
 * This function is kept for backward compatibility but may not work without proper admin context
 */
export async function addProject(
  project: Project,
  ownerId?: string
): Promise<void> {
  const supabase = getSupabase();

  // If no owner ID provided, try to get the first super admin
  let ownerIdToUse = ownerId;
  if (!ownerIdToUse) {
    const { data: admins } = await supabase
      .from('admins')
      .select('id')
      .eq('is_super_admin', true)
      .limit(1);

    if (admins && admins.length > 0) {
      ownerIdToUse = admins[0].id;
    } else {
      throw new Error('No owner ID provided and no super admin found');
    }
  }

  // Insert project
  const { error: projectError } = await supabase.from('projects').insert({
    id: project.id,
    name: project.name,
    client_password: project.clientPassword,
    owner_id: ownerIdToUse,
  });

  if (projectError) {
    throw new Error(`Failed to add project: ${projectError.message}`);
  }

  // Insert versions
  for (const version of project.versions) {
    const { error: versionError } = await supabase
      .from('project_versions')
      .insert({
        id: version.id,
        project_id: project.id,
        label: version.label,
        url: version.url,
      });

    if (versionError) {
      console.error(`Failed to add version ${version.id}:`, versionError);
    }
  }
}

/**
 * Save projects config (for backward compatibility)
 * @deprecated Use addProject or the admin APIs instead
 */
export async function saveProjects(_projects: ProjectsConfig): Promise<void> {
  console.warn(
    'saveProjects is deprecated. Use addProject or admin APIs instead.'
  );
  throw new Error('saveProjects is deprecated');
}
