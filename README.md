# PinUp - Prototype Review Platform

PinUp is a design feedback platform that allows clients to leave contextual comments pinned to specific elements on design prototypes. Comments capture CSS selectors and viewport information, making feedback actionable for developers.

## Features

- **Contextual Feedback**: Click on any element to leave a comment pinned to that exact location
- **CSS Selector Capture**: Automatically generates CSS selectors for targeted elements
- **Version Control**: Switch between prototype versions, with comments scoped per version
- **Browse/Comment Modes**: Panel closed = normal browsing; Panel open = comment mode
- **Role-Based Access**: Separate client and admin authentication
- **Cursor/Claude Export**: Export comments as markdown ready for AI coding assistants

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Equator Design System tokens
- **Database**: Upstash Redis (Vercel KV compatible)
- **Fonts**: Poppins (UI), Korolev (Display)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `PINUP_ADMIN_PASSWORD`: Global admin password
- `KV_REST_API_URL`: Upstash Redis REST URL
- `KV_REST_API_TOKEN`: Upstash Redis REST token

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the project list.

## Adding Projects

Projects are configured in `projects.config.ts`. To add a new project:

```typescript
// projects.config.ts
export const projects: ProjectsConfig = {
  "my-project": {
    id: "my-project",
    name: "My Project Prototype",
    clientPassword: "client-review-password",
    versions: [
      { 
        id: "v1", 
        label: "V1 - Initial", 
        url: "/prototypes/my-project/v1/index.html" 
      }
    ]
  }
};
```

Then add your prototype HTML files to `/public/prototypes/my-project/v1/`.

## Adding Prototypes

Place prototype HTML files in the `public/prototypes` directory:

```
public/
└── prototypes/
    └── my-project/
        └── v1/
            └── index.html
```

Prototypes can use any HTML/CSS/JS. Click capture is injected automatically.

## Using PinUp

### Browse Mode (Comments Panel Closed)
- Prototype behaves normally - links work, buttons are clickable
- Use this to explore and test the prototype

### Comment Mode (Comments Panel Open)
- Click on any element to add a comment
- Existing comments are shown as numbered dots
- "Click anywhere to add a comment" hint appears at the bottom

Toggle between modes by clicking the comments button in the header.

## Authentication

### Client Access
- Use project-specific password from `projects.config.ts`
- Can view prototype, add comments, delete own comments
- Cannot export or delete others' comments

### Admin Access
- Use global password from `PINUP_ADMIN_PASSWORD` env var
- Full access: view, add, delete any comment, export

## Export Format

Admins can export comments as Cursor-ready markdown:

```markdown
## PinUp Feedback Export
**Project:** My Project
**Version:** V1 - Initial
**Comments:** 3 items

---

### 📌 Comment #1
**Element:** `.hero-section h1`
**Viewport:** Desktop (1440px)
**Author:** Sarah

**Feedback:**
"Headline feels too generic"

**Suggested action:**
Update heading text in .hero-section h1 to be more specific/compelling.

---
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add Upstash Redis integration from Vercel Marketplace
4. Set `PINUP_ADMIN_PASSWORD` environment variable
5. Deploy

### Manual

```bash
npm run build
npm start
```

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
├── lib/                    # Utilities and helpers
├── types/                  # TypeScript types
├── public/
│   └── prototypes/         # Prototype HTML files
└── projects.config.ts      # Project definitions
```

## Design System

PinUp uses the Equator Design System tokens:

- **Primary Color**: Pink (#ff00a1)
- **Font**: Poppins (UI), Korolev (Display headings)
- **Spacing**: 8px base unit
- **Border Radius**: 6px (sm), 12px (md), 20px (lg)

## License

Internal use only - Equator Design
