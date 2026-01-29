# Upload to PinUp

> **Copy this file to your project folder** to enable the "Upload to PinUp" command with Claude Code.

## Trigger Phrases

When the user says any of these, follow the instructions below:
- "Upload to PinUp"
- "Add to PinUp"
- "Publish to PinUp"
- "Share on PinUp"

---

## PinUp Location

```
/Users/jamie.jefferson/AppDev/PinUp
```

---

## Instructions for Claude Code

### Step 1: Gather Information

Ask the user for the following (suggest defaults where possible):

| Field | Description | Example |
|-------|-------------|---------|
| **Project name** | Display name for the project | "Mobile App Redesign" |
| **Project ID** | URL slug (auto-generate from name: lowercase, spaces → dashes) | "mobile-app-redesign" |
| **Client password** | Password for client access | "mobile-review-2026" |
| **Version label** | Label for this version | "V1 - Initial Concept" |
| **Prototype file** | Path to HTML file to upload (in current project) | "./prototype.html" or "./dist/index.html" |

### Step 2: Create Prototype Directory

Create the directory structure in PinUp:

```
/Users/jamie.jefferson/AppDev/PinUp/public/prototypes/[project-id]/v1/
```

### Step 3: Copy Prototype Files

Copy the user's prototype HTML file (and any related assets) to:

```
/Users/jamie.jefferson/AppDev/PinUp/public/prototypes/[project-id]/v1/index.html
```

If the prototype references local CSS/JS files, copy those too and update paths as needed.

### Step 4: Update Project Config

Add a new entry to `/Users/jamie.jefferson/AppDev/PinUp/projects.config.ts`:

```typescript
// Add this to the projects object:
"[project-id]": {
  id: "[project-id]",
  name: "[Project Name]",
  clientPassword: "[client-password]",
  versions: [
    { 
      id: "v1", 
      label: "[Version Label]", 
      url: "/prototypes/[project-id]/v1/index.html" 
    }
  ]
}
```

**Important:** Add a comma after the previous project entry before adding the new one.

### Step 5: Confirm Success

Tell the user:

```
✓ Uploaded to PinUp!

Project: [Project Name]
URL: http://localhost:3000/[project-id]
Client Password: [client-password]

Share this URL and password with your client to collect feedback.
```

---

## Adding a New Version to Existing Project

If the user wants to add a new version to an existing project:

1. Find the existing project in `projects.config.ts`
2. Determine next version number (v2, v3, etc.)
3. Create directory: `/Users/jamie.jefferson/AppDev/PinUp/public/prototypes/[project-id]/v[N]/`
4. Copy prototype files to the new version directory
5. Add new version to the project's `versions` array:

```typescript
versions: [
  { id: "v1", label: "V1 - Initial", url: "/prototypes/[project-id]/v1/index.html" },
  { id: "v2", label: "[New Version Label]", url: "/prototypes/[project-id]/v2/index.html" }  // ← Add this
]
```

---

## Notes

- **Project IDs** must be lowercase with dashes (no spaces or special characters)
- **Prototypes** can use any HTML/CSS/JS - PinUp injects click tracking automatically
- **Comments** are stored per-version, so each version has its own feedback thread
- Run `npm run dev` in PinUp to start the local server if not already running
