import { Comment, CreateCommentRequest, getDeviceType, UserType } from '@/types';
import { getSupabase } from './supabase';

/**
 * Database row type (snake_case)
 */
interface CommentRow {
  id: string;
  project_id: string;
  version_id: string;
  created_at: string;
  author_name: string;
  author_type: UserType;
  text: string;
  element_selector: string;
  element_text: string;
  click_x: number;
  click_y: number;
  viewport_width: number;
  viewport_height: number;
  device_type: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Convert database row to Comment type
 */
function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    projectId: row.project_id,
    versionId: row.version_id,
    createdAt: row.created_at,
    authorName: row.author_name,
    authorType: row.author_type,
    text: row.text,
    elementSelector: row.element_selector,
    elementText: row.element_text,
    clickX: row.click_x,
    clickY: row.click_y,
    viewportWidth: row.viewport_width,
    viewportHeight: row.viewport_height,
    deviceType: row.device_type,
  };
}

/**
 * Create a new comment
 */
export async function createComment(
  request: CreateCommentRequest,
  authorName: string,
  authorType: UserType
): Promise<Comment> {
  const supabase = getSupabase();
  const deviceType = getDeviceType(request.viewportWidth);

  const { data, error } = await supabase
    .from('comments')
    .insert({
      project_id: request.projectId,
      version_id: request.versionId,
      author_name: authorName,
      author_type: authorType,
      text: request.text,
      element_selector: request.elementSelector,
      element_text: request.elementText.slice(0, 100),
      click_x: request.clickX,
      click_y: request.clickY,
      viewport_width: request.viewportWidth,
      viewport_height: request.viewportHeight,
      device_type: deviceType,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  return rowToComment(data as CommentRow);
}

/**
 * Get all comments for a project version
 */
export async function getComments(
  projectId: string,
  versionId: string
): Promise<Comment[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .eq('version_id', versionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  return (data as CommentRow[]).map(rowToComment);
}

/**
 * Get a single comment by ID
 */
export async function getComment(id: string): Promise<Comment | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch comment: ${error.message}`);
  }

  return rowToComment(data as CommentRow);
}

/**
 * Delete a comment
 */
export async function deleteComment(id: string): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }

  return true;
}

/**
 * Get comment count for a project version
 */
export async function getCommentCount(
  projectId: string,
  versionId: string
): Promise<number> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('version_id', versionId);

  if (error) {
    throw new Error(`Failed to count comments: ${error.message}`);
  }

  return count || 0;
}

/**
 * Delete all comments for a project (all versions)
 */
export async function deleteProjectComments(projectId: string): Promise<number> {
  const supabase = getSupabase();

  // First get the count
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Then delete all
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to delete project comments: ${error.message}`);
  }

  return count || 0;
}
