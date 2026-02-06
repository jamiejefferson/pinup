import 'server-only';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const PROTOTYPES_DIR = path.join(process.cwd(), 'public', 'prototypes');

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

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
 * Extract a ZIP buffer to the prototypes directory
 */
export async function extractPrototype(
  zipBuffer: Buffer,
  projectId: string,
  versionId: string
): Promise<{ url: string; fileCount: number }> {
  const targetDir = path.join(PROTOTYPES_DIR, projectId, versionId);

  // Ensure the target directory exists
  await fs.promises.mkdir(targetDir, { recursive: true });

  let fileCount = 0;
  let hasIndexHtml = false;

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      const entryPath = sanitizePath(entry.entryName);

      // Skip empty paths or disallowed files
      if (!entryPath || !isAllowedFile(entryPath)) {
        continue;
      }

      const fullPath = path.join(targetDir, entryPath);

      // Ensure the path is within the target directory (prevent path traversal)
      if (!fullPath.startsWith(targetDir)) {
        continue;
      }

      if (entry.isDirectory) {
        await fs.promises.mkdir(fullPath, { recursive: true });
      } else {
        // Ensure parent directory exists
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

        // Check for index.html
        if (entryPath === 'index.html' || entryPath.endsWith('/index.html')) {
          hasIndexHtml = true;
        }

        // Write the file
        const data = entry.getData();
        await fs.promises.writeFile(fullPath, data);
        fileCount++;
      }
    }

    // Verify we have an index.html
    if (!hasIndexHtml) {
      // Check if there's an index.html at the root
      const indexPath = path.join(targetDir, 'index.html');
      if (!fs.existsSync(indexPath)) {
        // Clean up and throw error
        await fs.promises.rm(targetDir, { recursive: true, force: true });
        throw new Error('ZIP must contain an index.html file');
      }
    }

    return {
      url: `/prototypes/${projectId}/${versionId}/index.html`,
      fileCount,
    };
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * Delete a version's files
 */
export async function deleteVersionFiles(
  projectId: string,
  versionId: string
): Promise<void> {
  const targetDir = path.join(PROTOTYPES_DIR, projectId, versionId);

  if (fs.existsSync(targetDir)) {
    await fs.promises.rm(targetDir, { recursive: true, force: true });
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
