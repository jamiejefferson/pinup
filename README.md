# PinUp - Prototype Review Platform

PinUp is a multi-tenant design feedback platform that allows clients to leave contextual comments pinned to specific elements on design prototypes. Comments capture CSS selectors and viewport information, making feedback actionable for developers.

## Features

- **Contextual Feedback**: Click on any element to leave a comment pinned to that exact location
- **CSS Selector Capture**: Automatically generates CSS selectors for targeted elements
- **Version Control**: Switch between prototype versions, with comments scoped per version
- **Browse/Comment Modes**: Panel closed = normal browsing; Panel open = comment mode
- **Multi-Tenancy**: Admin users manage their own projects independently
- **Super Admin**: Full system access for managing all projects and admin accounts
- **ZIP Upload**: Upload prototypes as ZIP files through the admin portal
- **Cursor/Claude Export**: Export comments as markdown ready for AI coding assistants

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/jamiejefferson/pinup.git
cd pinup
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_multi_tenancy.sql`
3. Go to **Storage** and create a bucket named `Prototypes` (make it public)
4. Go to **Settings > API** and copy your credentials

### 4. Configure Environment

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Legacy admin password (for reviewing as admin)
PINUP_ADMIN_PASSWORD=your-secure-admin-password

# Initial Super Admin
PINUP_SUPER_ADMIN_EMAIL=admin@example.com
PINUP_SUPER_ADMIN_PASSWORD=initial-password
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see PinUp running.

---

## Admin Portal

### Accessing the Admin Portal

Navigate to `/admin/login` to access the admin portal.

### Admin Features

- **Dashboard**: View your projects and stats
- **Create Projects**: Set up new projects with client passwords
- **Upload Prototypes**: Upload ZIP files containing your prototypes
- **Manage Versions**: Add multiple versions for A/B comparison

### Super Admin Features

- **All Projects**: Access and manage all projects across the system
- **Admin Management**: Create, edit, deactivate admin accounts
- **Activity Log**: View system-wide activity

---

## Uploading Prototypes

### Via Admin Portal (Recommended)

1. Log in to the admin portal at `/admin/login`
2. Create a new project or select an existing one
3. Click "Upload Version"
4. Drag and drop a ZIP file containing your prototype
5. The ZIP must include an `index.html` at the root

### ZIP File Requirements

- Must contain `index.html` at the root
- All asset paths should be relative (`./assets/` not `/assets/`)
- Maximum file size: 50MB
- Allowed file types: HTML, CSS, JS, images, fonts, audio, video

### For Vite/React Projects

Before creating the ZIP, configure for subdirectory hosting:

1. Set relative base in `vite.config.js`:
   ```js
   export default defineConfig({
     base: './',
   })
   ```

2. Use HashRouter (React Router):
   ```jsx
   import { HashRouter } from 'react-router-dom'
   ```

3. Rebuild: `npm run build`
4. ZIP the `dist` folder contents

---

## Using PinUp (Client Review)

### Accessing a Project

1. Go to `https://your-pinup-url.com/[project-id]`
2. Enter the client password and your name
3. Click "Enter Review"

### Browse Mode (Panel Closed)
- Prototype behaves normally - links work, buttons are clickable
- Use this to explore and test the prototype

### Comment Mode (Panel Open)
- Click the "Comments" button to open the panel
- Click on any element to add a comment
- Existing comments shown as numbered dots
- Hover over a comment card to highlight its dot

Toggle between modes by clicking the comments button in the header.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Hosting | Vercel |

---

## Project Structure

```
pinup/
├── app/
│   ├── [project]/              # Client review interface
│   ├── admin/                  # Admin portal
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   └── super/              # Super admin only
│   └── api/
│       ├── auth/               # Client auth
│       ├── admin/              # Admin API
│       ├── comments/
│       ├── export/
│       └── prototypes/         # Storage proxy
├── components/
├── lib/
├── supabase/
│   └── migrations/
├── types/
└── public/
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `PINUP_ADMIN_PASSWORD` | Password for admin access in reviews |
| `PINUP_SUPER_ADMIN_EMAIL` | Initial super admin email |
| `PINUP_SUPER_ADMIN_PASSWORD` | Initial super admin password |

---

## Troubleshooting

### Prototype not loading?
- Ensure ZIP contains `index.html` at root
- Check that asset paths are relative (`./` not `/`)
- For React Router apps, use `HashRouter`

### Comments not saving?
- Verify Supabase credentials
- Check browser console for API errors
- Ensure database migration has been run

### Can't upload prototype?
- Check file size (max 50MB)
- Ensure ZIP format is correct
- Verify Supabase Storage bucket exists and is public

### Admin login not working?
- Verify admin account exists in database
- Check password is correct
- Ensure account is active

---

## Documentation

- [PINUP-SPECIFICATION.md](./PINUP-SPECIFICATION.md) - Full product specification
- [PINUP-UPLOAD.md](./PINUP-UPLOAD.md) - Claude Code upload integration

---

## License

Internal use only - Equator Design
