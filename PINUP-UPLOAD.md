# Upload to PinUp

> **Note:** PinUp now has a built-in admin portal for uploading prototypes. This file documents the legacy Claude Code integration and the new recommended workflow.

---

## Recommended: Use Admin Portal

The easiest way to upload prototypes is through the PinUp admin portal:

1. Go to `https://your-pinup-url.com/admin/login`
2. Log in with your admin credentials
3. Create a project or select an existing one
4. Click "Upload Version"
5. Upload your prototype as a ZIP file

The admin portal handles everything automatically - no manual file copying or config editing needed.

---

## Preparing Your Prototype

Before uploading (either via admin portal or manually), ensure your prototype is configured for subdirectory hosting.

### For Vite/React/Vue Projects

1. **Set relative base path** in `vite.config.js`:
   ```js
   export default defineConfig({
     base: './',
     // ... other config
   })
   ```

2. **Use HashRouter instead of BrowserRouter** (React Router only):
   ```jsx
   // Change this:
   import { BrowserRouter } from 'react-router-dom'
   
   // To this:
   import { HashRouter } from 'react-router-dom'
   ```

3. **Rebuild the project**:
   ```bash
   npm run build
   ```

4. **Create ZIP from dist folder**:
   ```bash
   cd dist
   zip -r ../prototype.zip .
   ```

### For Plain HTML Prototypes

1. **Use relative asset paths**:
   ```html
   <!-- Good -->
   <script src="./assets/main.js"></script>
   <link href="./styles/main.css" rel="stylesheet">
   
   <!-- Bad - won't work in subdirectory -->
   <script src="/assets/main.js"></script>
   ```

2. **Create ZIP with index.html at root**:
   ```bash
   zip -r prototype.zip index.html assets/ styles/
   ```

---

## ZIP File Requirements

- Must contain `index.html` at the root level
- Maximum file size: 50MB
- Allowed file types:
  - HTML, CSS, JavaScript
  - Images (PNG, JPG, GIF, SVG, WebP, ICO)
  - Fonts (WOFF, WOFF2, TTF, OTF, EOT)
  - Media (MP4, WebM, MP3, WAV, OGG)
  - JSON

---

## Claude Code Integration (Legacy)

If you prefer to use Claude Code for uploads, you can still do manual uploads:

### Trigger Phrases

When the user says any of these, follow the instructions below:
- "Upload to PinUp"
- "Add to PinUp"
- "Publish to PinUp"

### Instructions for Claude Code

#### Step 1: Gather Information

Ask the user for:

| Field | Description | Example |
|-------|-------------|---------|
| **Project name** | Display name | "Mobile App Redesign" |
| **Project ID** | URL slug (auto-generate) | "mobile-app-redesign" |
| **Client password** | Password for client access | "mobile-review-2026" |
| **Version label** | Label for this version | "V1 - Initial Concept" |
| **Prototype file** | Path to ZIP or HTML | "./dist" or "./prototype.html" |

#### Step 2: Prepare Prototype

Follow the preparation steps above to ensure the prototype works in a subdirectory.

#### Step 3: Upload via Admin Portal API

The recommended approach is to use the admin API:

```bash
# Create project (if new)
curl -X POST https://your-pinup-url.com/api/admin/projects \
  -H "Cookie: pinup_admin_session=..." \
  -H "Content-Type: application/json" \
  -d '{"id": "project-id", "name": "Project Name", "clientPassword": "password"}'

# Upload version
curl -X POST https://your-pinup-url.com/api/admin/projects/project-id/versions \
  -H "Cookie: pinup_admin_session=..." \
  -F "file=@prototype.zip" \
  -F "label=V1 - Initial"
```

#### Alternative: Direct Database + Storage

For local development, you can also:

1. Upload files to Supabase Storage bucket `Prototypes/{project-id}/{version-id}/`
2. Add project record to `projects` table
3. Add version record to `project_versions` table

---

## Adding New Versions

To add a new version to an existing project:

### Via Admin Portal (Recommended)

1. Go to `/admin/projects/[project-id]`
2. Click "Upload New Version"
3. Enter version label and upload ZIP

### Via API

```bash
curl -X POST https://your-pinup-url.com/api/admin/projects/project-id/versions \
  -H "Cookie: pinup_admin_session=..." \
  -F "file=@prototype-v2.zip" \
  -F "label=V2 - Post-feedback"
```

---

## Notes

- **Project IDs** must be lowercase with dashes (no spaces or special characters)
- **Prototypes** can use any HTML/CSS/JS - PinUp injects click tracking automatically
- **Comments** are stored per-version, so each version has its own feedback thread
- **Storage**: Prototypes are stored in Supabase Storage, not local filesystem
- **Proxy**: Files are served via `/api/prototypes/...` to enable comment dot injection
