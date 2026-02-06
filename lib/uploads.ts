import 'server-only';
import path from 'path';
import AdmZip from 'adm-zip';
import { getSupabase } from './supabase';

// Storage bucket name (must match what was created in Supabase dashboard)
const STORAGE_BUCKET = 'Prototypes';

// Allowed file extensions for prototype uploads
const ALLOWED_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
  '.ogg',
]);

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Get MIME type for a file
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Validate file extension
 */
function isAllowedFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  // Allow files without extensions (might be directories)
  if (!ext) return true;
  return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Sanitize path to prevent directory traversal
 */
function sanitizePath(filePath: string): string {
  // Remove any leading slashes or dots
  let sanitized = filePath.replace(/^[./\\]+/, '');
  // Remove any path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/');
  return sanitized;
}

/**
 * Get the proxy URL for a file (serves from same origin to enable script injection)
 */
function getProxyUrl(storagePath: string): string {
  return `/api/prototypes/${storagePath}`;
}

/**
 * Extract a ZIP buffer and upload to Supabase Storage
 */
export async function extractPrototype(
  zipBuffer: Buffer,
  projectId: string,
  versionId: string
): Promise<{ url: string; fileCount: number }> {
  const supabase = getSupabase();
  const basePath = `${projectId}/${versionId}`;

  let fileCount = 0;
  let hasIndexHtml = false;
  const uploadedFiles: string[] = [];

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // Process all entries
    for (const entry of entries) {
      const entryPath = sanitizePath(entry.entryName);

      // Skip empty paths, directories, or disallowed files
      if (!entryPath || entry.isDirectory || !isAllowedFile(entryPath)) {
        continue;
      }

      // Check for index.html
      if (entryPath === 'index.html' || entryPath.endsWith('/index.html')) {
        hasIndexHtml = true;
      }

      // Get file data and upload to Supabase Storage
      const data = entry.getData();
      const storagePath = `${basePath}/${entryPath}`;
      const mimeType = getMimeType(entryPath);

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, data, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error(`Failed to upload ${storagePath}:`, error);
        throw new Error(`Failed to upload file: ${entryPath}`);
      }

      uploadedFiles.push(storagePath);
      fileCount++;
    }

    // Verify we have an index.html
    if (!hasIndexHtml) {
      // Clean up uploaded files
      await deleteVersionFiles(projectId, versionId);
      throw new Error('ZIP must contain an index.html file');
    }

    // Get the proxy URL for the index.html (same-origin for script injection)
    const indexPath = `${basePath}/index.html`;
    const proxyUrl = getProxyUrl(indexPath);

    return {
      url: proxyUrl,
      fileCount,
    };
  } catch (error) {
    // Clean up on error (if any files were uploaded)
    if (uploadedFiles.length > 0) {
      try {
        await deleteVersionFiles(projectId, versionId);
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

/**
 * Recursively list all files in a storage path
 */
async function listAllFiles(
  basePath: string,
  supabase: ReturnType<typeof getSupabase>
): Promise<string[]> {
  const allFiles: string[] = [];

  const { data: items, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(basePath, { limit: 1000 });

  if (error || !items) {
    return allFiles;
  }

  for (const item of items) {
    const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
    
    if (item.id === null) {
      // It's a folder - recurse into it
      const nestedFiles = await listAllFiles(itemPath, supabase);
      allFiles.push(...nestedFiles);
    } else {
      // It's a file
      allFiles.push(itemPath);
    }
  }

  return allFiles;
}

/**
 * Delete a version's files from Supabase Storage
 */
export async function deleteVersionFiles(
  projectId: string,
  versionId: string
): Promise<void> {
  const supabase = getSupabase();
  const basePath = `${projectId}/${versionId}`;

  // List all files recursively
  const allFiles = await listAllFiles(basePath, supabase);

  if (allFiles.length === 0) {
    return;
  }

  // Delete all files (Supabase allows batch delete up to 1000 files)
  const { error: deleteError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(allFiles);

  if (deleteError) {
    console.error('Failed to delete files:', deleteError);
  }
}

/**
 * Delete all files for a project from Supabase Storage
 */
export async function deleteProjectFiles(projectId: string): Promise<void> {
  const supabase = getSupabase();

  // List all files recursively under the project folder
  const allFiles = await listAllFiles(projectId, supabase);

  if (allFiles.length === 0) {
    return;
  }

  // Delete all files (Supabase allows batch delete up to 1000 files)
  const { error: deleteError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(allFiles);

  if (deleteError) {
    console.error('Failed to delete project files:', deleteError);
  }
}

/**
 * Validate upload file size
 */
export function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }
}
