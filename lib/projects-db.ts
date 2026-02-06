import 'server-only';
import { getSupabase } from './supabase';
import { Project, ProjectVersion } from '@/types/project';

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
 * Extended project type with owner info
 */
export interface ProjectWithOwner extends Project {
  ownerId: string;
  createdAt: string;
}

/**
 * Request to create a new project
 */
export interface CreateProjectRequest {
  id: string;
  name: string;
  clientPassword: string;
  ownerId: string;
}

/**
 * Request to update a project
 */
export interface UpdateProjectRequest {
  name?: string;
  clientPassword?: string;
}

/**
 * Request to create a new version
 */
export interface CreateVersionRequest {
  id?: string; // Auto-generated if not provided
  label: string;
  url: string;
}

/**
 * Convert database rows to Project type
 */
function rowsToProject(
  projectRow: ProjectRow,
  versionRows: ProjectVersionRow[]
): ProjectWithOwner {
  return {
    id: projectRow.id,
    name: projectRow.name,
    clientPassword: projectRow.client_password,
    ownerId: projectRow.owner_id,
    createdAt: projectRow.created_at,
    versions: versionRows.map((v) => ({
      id: v.id,
      label: v.label,
      url: v.url,
    })),
  };
}

/**
 * Create a new project
 */
export async function createProject(
  request: CreateProjectRequest
): Promise<ProjectWithOwner> {
  const supabase = getSupabase();

  // Validate project ID format
  if (!/^[a-z0-9-]+$/.test(request.id)) {
    throw new Error(
      'Project ID must only contain lowercase letters, numbers, and hyphens'
    );
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      id: request.id,
      name: request.name.trim(),
      client_password: request.clientPassword,
      owner_id: request.ownerId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A project with this ID already exists');
    }
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return rowsToProject(data as ProjectRow, []);
}

/**
 * Get a project by ID
 */
export async function getProjectById(
  id: string
): Promise<ProjectWithOwner | null> {
  const supabase = getSupabase();

  // Get project
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError) {
    if (projectError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch project: ${projectError.message}`);
  }

  // Get versions
  const { data: versionData, error: versionError } = await supabase
    .from('project_versions')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  if (versionError) {
    throw new Error(`Failed to fetch versions: ${versionError.message}`);
  }

  return rowsToProject(
    projectData as ProjectRow,
    versionData as ProjectVersionRow[]
  );
}

/**
 * Get all projects for an admin
 */
export async function getProjectsByOwner(
  ownerId: string
): Promise<ProjectWithOwner[]> {
  const supabase = getSupabase();

  // Get all projects for this owner
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (projectsError) {
    throw new Error(`Failed to fetch projects: ${projectsError.message}`);
  }

  if (!projectsData || projectsData.length === 0) {
    return [];
  }

  // Get all versions for these projects
  const projectIds = projectsData.map((p) => (p as ProjectRow).id);
  const { data: versionsData, error: versionsError } = await supabase
    .from('project_versions')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: true });

  if (versionsError) {
    throw new Error(`Failed to fetch versions: ${versionsError.message}`);
  }

  // Group versions by project
  const versionsByProject = new Map<string, ProjectVersionRow[]>();
  for (const version of versionsData as ProjectVersionRow[]) {
    const existing = versionsByProject.get(version.project_id) || [];
    existing.push(version);
    versionsByProject.set(version.project_id, existing);
  }

  // Build project objects
  return (projectsData as ProjectRow[]).map((project) =>
    rowsToProject(project, versionsByProject.get(project.id) || [])
  );
}

/**
 * Get all projects (for super admin)
 */
export async function getAllProjects(): Promise<ProjectWithOwner[]> {
  const supabase = getSupabase();

  // Get all projects
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectsError) {
    throw new Error(`Failed to fetch projects: ${projectsError.message}`);
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
    throw new Error(`Failed to fetch versions: ${versionsError.message}`);
  }

  // Group versions by project
  const versionsByProject = new Map<string, ProjectVersionRow[]>();
  for (const version of versionsData as ProjectVersionRow[]) {
    const existing = versionsByProject.get(version.project_id) || [];
    existing.push(version);
    versionsByProject.set(version.project_id, existing);
  }

  // Build project objects
  return (projectsData as ProjectRow[]).map((project) =>
    rowsToProject(project, versionsByProject.get(project.id) || [])
  );
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  request: UpdateProjectRequest
): Promise<ProjectWithOwner> {
  const supabase = getSupabase();

  const updates: Record<string, unknown> = {};
  if (request.name !== undefined) {
    updates.name = request.name.trim();
  }
  if (request.clientPassword !== undefined) {
    updates.client_password = request.clientPassword;
  }

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  const project = await getProjectById(id);
  if (!project) {
    throw new Error('Project not found after update');
  }

  return project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const supabase = getSupabase();

  // Versions will be cascade deleted
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  return true;
}

/**
 * Get the next version ID for a project
 */
export async function getNextVersionId(projectId: string): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('project_versions')
    .select('id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get versions: ${error.message}`);
  }

  // Find the highest version number
  let maxVersion = 0;
  for (const row of data || []) {
    const match = (row as { id: string }).id.match(/^v(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxVersion) {
        maxVersion = num;
      }
    }
  }

  return `v${maxVersion + 1}`;
}

/**
 * Create a new version for a project
 */
export async function createVersion(
  projectId: string,
  request: CreateVersionRequest
): Promise<ProjectVersion> {
  const supabase = getSupabase();

  // Auto-generate version ID if not provided
  const versionId = request.id || (await getNextVersionId(projectId));

  const { data, error } = await supabase
    .from('project_versions')
    .insert({
      id: versionId,
      project_id: projectId,
      label: request.label.trim(),
      url: request.url,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A version with this ID already exists');
    }
    throw new Error(`Failed to create version: ${error.message}`);
  }

  const row = data as ProjectVersionRow;
  return {
    id: row.id,
    label: row.label,
    url: row.url,
  };
}

/**
 * Delete a version
 */
export async function deleteVersion(
  projectId: string,
  versionId: string
): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('project_versions')
    .delete()
    .eq('project_id', projectId)
    .eq('id', versionId);

  if (error) {
    throw new Error(`Failed to delete version: ${error.message}`);
  }

  return true;
}

/**
 * Check if an admin owns a project
 */
export async function isProjectOwner(
  projectId: string,
  adminId: string
): Promise<boolean> {
  const project = await getProjectById(projectId);
  return project?.ownerId === adminId;
}

/**
 * Get project for client authentication (just needs ID and password)
 */
export async function getProjectForAuth(
  id: string
): Promise<{ id: string; clientPassword: string } | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select('id, client_password')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  const row = data as { id: string; client_password: string };
  return {
    id: row.id,
    clientPassword: row.client_password,
  };
}
