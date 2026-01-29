import { Comment, CreateCommentRequest, getDeviceType, UserType } from '@/types';
import { getRedis, KEYS } from './kv';

/**
 * Generate a UUID for comment IDs
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Create a new comment
 */
export async function createComment(
  request: CreateCommentRequest,
  authorName: string,
  authorType: UserType
): Promise<Comment> {
  const redis = getRedis();
  const id = generateId();
  const now = new Date().toISOString();
  
  const comment: Comment = {
    id,
    projectId: request.projectId,
    versionId: request.versionId,
    createdAt: now,
    authorName,
    authorType,
    text: request.text,
    elementSelector: request.elementSelector,
    elementText: request.elementText.slice(0, 100), // Truncate to 100 chars
    clickX: request.clickX,
    clickY: request.clickY,
    viewportWidth: request.viewportWidth,
    viewportHeight: request.viewportHeight,
    deviceType: getDeviceType(request.viewportWidth),
  };

  // Store the comment
  await redis.set(KEYS.comment(id), comment);
  
  // Add to the project/version set
  await redis.sadd(
    KEYS.projectVersionComments(request.projectId, request.versionId),
    id
  );

  return comment;
}

/**
 * Get all comments for a project version
 */
export async function getComments(
  projectId: string,
  versionId: string
): Promise<Comment[]> {
  const redis = getRedis();
  
  // Get all comment IDs for this version
  const ids = await redis.smembers(KEYS.projectVersionComments(projectId, versionId));
  
  if (!ids || ids.length === 0) {
    return [];
  }

  // Fetch all comments
  const comments = await Promise.all(
    ids.map(async (id) => {
      const comment = await redis.get(KEYS.comment(id as string));
      return comment as Comment | null;
    })
  );

  // Filter out nulls and sort by creation date (newest first)
  return comments
    .filter((c): c is Comment => c !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get a single comment by ID
 */
export async function getComment(id: string): Promise<Comment | null> {
  const redis = getRedis();
  const comment = await redis.get(KEYS.comment(id));
  return comment as Comment | null;
}

/**
 * Delete a comment
 */
export async function deleteComment(id: string): Promise<boolean> {
  const redis = getRedis();
  
  // First get the comment to know which set to remove from
  const comment = await getComment(id);
  
  if (!comment) {
    return false;
  }

  // Delete the comment
  await redis.del(KEYS.comment(id));
  
  // Remove from the project/version set
  await redis.srem(
    KEYS.projectVersionComments(comment.projectId, comment.versionId),
    id
  );

  return true;
}

/**
 * Get comment count for a project version
 */
export async function getCommentCount(
  projectId: string,
  versionId: string
): Promise<number> {
  const redis = getRedis();
  const ids = await redis.smembers(KEYS.projectVersionComments(projectId, versionId));
  return ids?.length || 0;
}
