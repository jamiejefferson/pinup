# PinUp — Product Specification

## Overview

PinUp is a multi-tenant prototype review platform that allows clients to provide contextual feedback on design prototypes. Comments are pinned to specific elements on the page, capturing CSS selectors and viewport information for easy handoff to development.

### Core Value Proposition
- Clients can review prototypes and leave comments on specific elements
- Comments capture element selectors, making feedback actionable for developers
- Export functionality generates Cursor/Claude Code-ready markdown
- Version switching allows comparison between iterations
- **Multi-tenancy**: Admin users manage their own projects independently
- **Super Admin**: Full system access for managing all projects and admin accounts

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (prototype files) |
| Hosting | Vercel |
| Authentication | Custom middleware (password-based for clients, email/password for admins) |

---

## Authentication Model

### Three User Types

#### Client (Project Reviewers)
- **Password**: Unique per project
- **Permissions**:
  - View prototype
  - Add comments
  - Delete their own comments
  - Switch versions
  - Cannot export comments
  - Cannot delete others' comments

#### Admin (Project Owners)
- **Authentication**: Email + password via admin portal
- **Permissions**:
  - Manage their own projects (CRUD)
  - Upload prototype versions (ZIP files)
  - View/add/delete comments on their projects
  - Export comments for Cursor
  - Cannot access other admins' projects

#### Super Admin
- **Authentication**: Email + password with elevated privileges
- **Permissions**:
  - All Admin permissions
  - Access ALL projects across the system
  - Manage admin accounts (create, edit, deactivate, delete)
  - View system-wide activity log
  - Access super admin dashboard

### Client Login Flow
1. User enters project password + their name
2. System validates against project's client password
3. Store auth state in cookie with user type and name

### Admin Login Flow
1. Admin navigates to `/admin/login`
2. Enter email + password
3. System validates against `admins` table in Supabase
4. Create admin session cookie
5. Redirect to admin dashboard

---

## Data Models

### Database Schema (Supabase)

#### admins
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

#### projects
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,  -- URL slug
  name TEXT NOT NULL,
  client_password TEXT NOT NULL,
  owner_id UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### project_versions
```sql
CREATE TABLE project_versions (
  id TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, id)
);
```

#### comments
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL,
  text TEXT NOT NULL,
  element_selector TEXT NOT NULL,
  element_text TEXT,
  click_x NUMERIC NOT NULL,
  click_y NUMERIC NOT NULL,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  device_type TEXT NOT NULL
);
```

#### admin_activity
```sql
CREATE TABLE admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Interfaces

```typescript
// types/project.ts
interface ProjectVersion {
  id: string;           // e.g., "v1", "v2"
  label: string;        // e.g., "V1 - Initial"
  url: string;          // Proxy URL to Supabase Storage
}

interface Project {
  id: string;           // URL slug
  name: string;
  clientPassword: string;
  ownerId: string;      // Admin UUID
  versions: ProjectVersion[];
  createdAt: string;
  updatedAt: string;
}

// types/admin.ts
interface Admin {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}
```

---

## Project Structure

```
pinup/
├── app/
│   ├── [project]/
│   │   ├── page.tsx                    # Main review interface
│   │   └── login/page.tsx              # Project login page
│   ├── admin/
│   │   ├── login/page.tsx              # Admin login
│   │   ├── dashboard/page.tsx          # Admin dashboard
│   │   ├── projects/
│   │   │   ├── new/page.tsx            # Create project
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Project details
│   │   │       └── upload/page.tsx     # Upload prototype version
│   │   └── super/
│   │       ├── page.tsx                # Super admin dashboard
│   │       ├── admins/
│   │       │   ├── page.tsx            # List admins
│   │       │   ├── new/page.tsx        # Create admin
│   │       │   └── [id]/page.tsx       # Edit admin
│   │       └── activity/page.tsx       # Activity log
│   ├── api/
│   │   ├── auth/                       # Client auth
│   │   ├── admin/
│   │   │   ├── auth/                   # Admin login/logout
│   │   │   ├── projects/               # Project CRUD
│   │   │   └── super/                  # Super admin endpoints
│   │   ├── comments/
│   │   ├── export/
│   │   └── prototypes/[...path]/       # Proxy for Supabase Storage
│   └── layout.tsx
├── components/
├── lib/
│   ├── auth.ts                         # Auth utilities
│   ├── admins.ts                       # Admin CRUD operations
│   ├── comments.ts                     # Comment operations
│   ├── projects.ts                     # Legacy project config
│   ├── projects-db.ts                  # Database project operations
│   ├── uploads.ts                      # Supabase Storage uploads
│   ├── selectors.ts                    # CSS selector generation
│   └── supabase.ts                     # Supabase client
├── supabase/
│   └── migrations/
│       └── 001_multi_tenancy.sql       # Database migration
├── middleware.ts                        # Auth middleware
└── types/
```

---

## Prototype Storage

### Supabase Storage

Prototypes are stored in a Supabase Storage bucket called `Prototypes`.

**Structure:**
```
Prototypes/
└── {project-id}/
    └── {version-id}/
        ├── index.html
        ├── assets/
        │   ├── styles.css
        │   └── script.js
        └── images/
```

**Upload Process:**
1. Admin uploads ZIP file containing prototype
2. Server extracts ZIP and validates (must contain `index.html`)
3. Files uploaded to Supabase Storage
4. Proxy URL stored in database: `/api/prototypes/{project-id}/{version-id}/index.html`

**Why Proxy URLs?**
- Files served from same origin enables script injection for comment dots
- Cross-origin restrictions prevent iframe script access
- Proxy route fetches from Supabase Storage and serves with correct MIME types

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Legacy admin password (for client login as admin)
PINUP_ADMIN_PASSWORD=your-secure-admin-password

# Initial Super Admin (for first-time setup)
PINUP_SUPER_ADMIN_EMAIL=admin@example.com
PINUP_SUPER_ADMIN_PASSWORD=initial-password
```

---

## Admin Portal Screens

### Admin Login (`/admin/login`)
- Email + password form
- Redirects to dashboard on success

### Admin Dashboard (`/admin/dashboard`)
- List of admin's projects
- Quick stats (total projects, total comments)
- Create new project button

### Create Project (`/admin/projects/new`)
- Project name (auto-generates slug)
- Client password
- Creates empty project in database

### Project Details (`/admin/projects/[id]`)
- Edit name, client password
- List of versions with upload dates
- Upload new version button
- Delete project

### Upload Version (`/admin/projects/[id]/upload`)
- Drag-and-drop ZIP upload
- Version label input
- Progress indicator
- Validates ZIP contains `index.html`

### Super Admin Dashboard (`/admin/super`)
- System-wide stats
- Recent activity
- Links to admin management

### Admin Management (`/admin/super/admins`)
- List all admin accounts
- Create new admin
- Edit admin (name, email, active status, super admin status)
- Reset password
- Delete admin (with confirmation)

### Activity Log (`/admin/super/activity`)
- Chronological list of admin actions
- Filterable by admin and action type

---

## Client Review Interface

### Main Interface (`/[project]`)

**Layout (Panel Collapsed):**
- Top bar with logo, project name, viewport indicator
- Version switcher dropdown
- "Comments (n)" button
- Export button (admin only)
- Prototype iframe (full width)

**Layout (Panel Open):**
- Sidebar (320px) with comment list
- Comment dots appear on prototype
- Click anywhere to add comment

### Comment Dots
- Rendered inside iframe DOM for smooth scrolling
- Position calculated from stored click coordinates
- Parent-iframe communication via postMessage

---

## API Specifications

### Admin Endpoints

#### POST /api/admin/auth/login
Authenticate admin user.

#### POST /api/admin/auth/logout
Clear admin session.

#### GET /api/admin/projects
List projects (owned by admin, or all for super admin).

#### POST /api/admin/projects
Create new project.

#### GET/PUT/DELETE /api/admin/projects/[id]
Project CRUD operations.

#### POST /api/admin/projects/[id]/versions
Upload new prototype version (multipart form with ZIP file).

#### GET /api/admin/super/admins
List all admin accounts (super admin only).

#### POST /api/admin/super/admins
Create new admin account (super admin only).

#### GET/PUT/DELETE /api/admin/super/admins/[id]
Admin account management (super admin only).

#### GET /api/admin/super/activity
System activity log (super admin only).

### Prototype Proxy

#### GET /api/prototypes/[...path]
Proxies files from Supabase Storage to maintain same-origin for iframe script injection.

---

## Deployment Checklist

1. Create Vercel project
2. Create Supabase project
3. Run database migration (`supabase/migrations/001_multi_tenancy.sql`)
4. Create Supabase Storage bucket named `Prototypes` (public)
5. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `PINUP_ADMIN_PASSWORD`
   - `PINUP_SUPER_ADMIN_EMAIL`
   - `PINUP_SUPER_ADMIN_PASSWORD`
6. Deploy
7. Run migration script to create initial super admin

---

## Security Considerations

- Admin passwords hashed with bcrypt (10 rounds)
- Admin sessions stored in HttpOnly cookies
- Row-level security (RLS) on Supabase tables
- Ownership checks on all project operations
- Super admin routes protected by middleware
- File uploads validated for type and size (50MB max)
- Path sanitization prevents directory traversal

---

## Future Considerations

- Comment threading/replies
- Comment resolution status
- Email notifications for new admins
- Approval workflows
- Team/organization support
- SSO integration
