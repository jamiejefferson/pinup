# PinUp - Prototype Review Platform

PinUp is a design feedback platform that allows clients to leave contextual comments pinned to specific elements on design prototypes. Comments capture CSS selectors and viewport information, making feedback actionable for developers.

## Quick Start for Team Members

### 1. Clone the Repository

```bash
git clone https://github.com/jamiejefferson/pinup.git
cd pinup
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your credentials:

| Variable | Description |
|----------|-------------|
| `PINUP_ADMIN_PASSWORD` | Global admin password for full access |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

**Getting Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **Settings > API**
4. Copy the **Project URL** and **anon/public** key

**Setting up the database:**
1. In Supabase, go to **SQL Editor**
2. Run the contents of `supabase-schema.sql` to create the comments table

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see PinUp running.

---

## Uploading Prototypes with Claude Code

The easiest way to add prototypes to PinUp is using Claude Code with the upload command file.

### Setup (One Time)

1. Copy `PINUP-UPLOAD.md` from this repository to your project folder
2. That's it!

### Usage

When working in Claude Code on any prototype project, just say:

- "Upload to PinUp"
- "Add to PinUp"
- "Publish to PinUp"
- "Share on PinUp"

Claude will:
1. Ask for project details (name, password, version label)
2. Prepare your prototype for subdirectory hosting
3. Copy files to PinUp
4. Update the project config
5. Commit and push to deploy
6. Give you the live URL to share with clients

### Adding New Versions

To add a new version to an existing project, just say "Upload to PinUp" again. Claude will detect the existing project and add a new version (v2, v3, etc.).

---

## Features

- **Contextual Feedback**: Click on any element to leave a comment pinned to that exact location
- **CSS Selector Capture**: Automatically generates CSS selectors for targeted elements
- **Version Control**: Switch between prototype versions, with comments scoped per version
- **Browse/Comment Modes**: Panel closed = normal browsing; Panel open = comment mode
- **Role-Based Access**: Separate client and admin authentication
- **Cursor/Claude Export**: Export comments as markdown ready for AI coding assistants

---

## Manual Project Setup

If you prefer to add projects manually (without Claude Code):

### 1. Create Directory Structure

```
public/prototypes/my-project/v1/
```

### 2. Add Prototype Files

Copy your HTML prototype to `public/prototypes/my-project/v1/index.html`

**Important:** Ensure all asset paths are relative (use `./assets/` not `/assets/`)

### 3. Configure Project

Add to `data/projects.json`:

```json
{
  "my-project": {
    "id": "my-project",
    "name": "My Project Prototype",
    "clientPassword": "client-review-password",
    "versions": [
      {
        "id": "v1",
        "label": "V1 - Initial",
        "url": "/prototypes/my-project/v1/index.html"
      }
    ]
  }
}
```

### 4. Deploy

```bash
git add .
git commit -m "Add my-project prototype"
git push
```

---

## Using PinUp

### Browse Mode (Comments Panel Closed)
- Prototype behaves normally - links work, buttons are clickable
- Use this to explore and test the prototype

### Comment Mode (Comments Panel Open)
- Click on any element to add a comment
- Existing comments are shown as numbered dots
- "Click anywhere to add a comment" hint appears at the bottom

Toggle between modes by clicking the comments button in the header.

---

## Authentication

### Client Access
- Use project-specific password from `data/projects.json`
- Can view prototype, add comments, delete own comments
- Cannot export or delete others' comments

### Admin Access
- Use global password from `PINUP_ADMIN_PASSWORD` env var
- Full access: view, add, delete any comment, export

---

## Export Format

Admins can export comments as Cursor/Claude-ready markdown:

```markdown
## PinUp Feedback Export
**Project:** My Project
**Version:** V1 - Initial
**Comments:** 3 items

---

### Comment #1
**Element:** `.hero-section h1`
**Viewport:** Desktop (1440px)
**Author:** Sarah

**Feedback:**
"Headline feels too generic"

**Suggested action:**
Update heading text in .hero-section h1 to be more specific/compelling.
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `PINUP_ADMIN_PASSWORD`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

**Live URL:** https://pinup-chi.vercel.app

### Manual

```bash
npm run build
npm start
```

---

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Equator Design System tokens
- **Database**: Supabase (PostgreSQL)
- **Fonts**: Poppins (UI), Korolev (Display)

---

## Project Structure

```
pinup/
├── app/
│   ├── [project]/          # Dynamic project routes
│   │   ├── page.tsx        # Review interface
│   │   └── login/page.tsx  # Project login
│   ├── api/                # API routes
│   └── page.tsx            # Landing page
├── components/             # React components
├── data/
│   └── projects.json       # Project definitions
├── lib/                    # Utilities and helpers
├── types/                  # TypeScript types
├── public/
│   └── prototypes/         # Prototype HTML files
├── PINUP-UPLOAD.md         # Upload command for Claude Code
├── PINUP-SPECIFICATION.md  # Full product spec
└── supabase-schema.sql     # Database schema for Supabase
```

---

## Troubleshooting

### Prototype not loading?
- Check that asset paths are relative (`./` not `/`)
- For React Router apps, use `HashRouter` instead of `BrowserRouter`
- Rebuild Vite projects with `base: './'` in config

### Comments not saving?
- Verify Supabase credentials in `.env.local`
- Make sure you've run `supabase-schema.sql` in your Supabase SQL Editor
- Check browser console for API errors

### Can't delete project?
- You need admin password to delete projects
- Hover over project card to reveal delete button

---

## License

Internal use only - Equator Design
