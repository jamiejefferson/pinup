# PinUp — Product Specification

## Overview

PinUp is a prototype review platform that allows clients to provide contextual feedback on design prototypes. Comments are pinned to specific elements on the page, capturing CSS selectors and viewport information for easy handoff to development.

### Core Value Proposition
- Clients can review prototypes and leave comments on specific elements
- Comments capture element selectors, making feedback actionable for developers
- Export functionality generates Cursor/Claude Code-ready markdown
- Version switching allows comparison between iterations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Storage | Vercel KV (Redis) |
| Hosting | Vercel |
| Authentication | Custom middleware (password-based) |

---

## Authentication Model

### Two User Types

#### Client
- **Password**: Unique per project (e.g., `hotel-review-2025`)
- **Permissions**:
  - ✅ View prototype
  - ✅ Add comments
  - ✅ Delete their own comments
  - ✅ Switch versions
  - ❌ Export comments
  - ❌ Delete others' comments
  - ❌ See export button

#### Admin
- **Password**: Global, same for all projects (environment variable)
- **Permissions**:
  - ✅ View prototype
  - ✅ Add comments
  - ✅ Delete ANY comment
  - ✅ Switch versions
  - ✅ Export comments for Cursor
  - ✅ See admin badge

### Login Flow
1. User enters password + their name
2. System checks password against:
   - Project-specific client password → Grant client access
   - Global admin password → Grant admin access
   - Neither → Access denied
3. Store auth state in cookie with user type and name

---

## Data Models

### Project Configuration

```typescript
// types/project.ts

interface ProjectVersion {
  id: string;           // e.g., "v1", "v2", "v3"
  label: string;        // e.g., "V1 - Initial", "V2 - Post-feedback"
  url: string;          // URL to the prototype (can be relative or absolute)
}

interface Project {
  id: string;           // URL slug, e.g., "hotel-booking"
  name: string;         // Display name, e.g., "Hotel Booking Prototype"
  clientPassword: string;
  versions: ProjectVersion[];
}
```

### Comment

```typescript
// types/comment.ts

interface Comment {
  id: string;                    // UUID
  projectId: string;             // Reference to project
  versionId: string;             // Which version this comment belongs to
  createdAt: string;             // ISO timestamp
  
  // Author
  authorName: string;            // Name entered at login
  authorType: 'client' | 'admin';
  
  // Feedback
  text: string;
  
  // Element targeting
  elementSelector: string;       // CSS selector path to element
  elementText: string;           // Truncated inner text for context (max 100 chars)
  clickX: number;                // X position of click within element (percentage)
  clickY: number;                // Y position of click within element (percentage)
  
  // Viewport context
  viewportWidth: number;
  viewportHeight: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}
```

### Auth Session

```typescript
// types/auth.ts

interface AuthSession {
  projectId: string;
  userName: string;
  userType: 'client' | 'admin';
  expiresAt: string;            // ISO timestamp
}
```

---

## Project Structure

```
pinup/
├── app/
│   ├── [project]/
│   │   ├── page.tsx                    # Main review interface
│   │   └── login/
│   │       └── page.tsx                # Project login page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          # POST - authenticate
│   │   │   └── logout/route.ts         # POST - clear session
│   │   ├── comments/
│   │   │   ├── route.ts                # GET (list), POST (create)
│   │   │   └── [id]/route.ts           # DELETE
│   │   └── export/
│   │       └── route.ts                # GET - generate markdown
│   └── layout.tsx
├── components/
│   ├── PrototypeFrame.tsx              # iframe wrapper for prototype
│   ├── CommentOverlay.tsx              # Click capture layer
│   ├── CommentDot.tsx                  # Individual dot marker
│   ├── CommentPanel.tsx                # Sidebar/overlay with comment list
│   ├── CommentCard.tsx                 # Single comment in panel
│   ├── AddCommentModal.tsx             # Modal for adding comment
│   ├── DeleteConfirmDialog.tsx         # Confirmation dialog
│   ├── VersionSwitcher.tsx             # Dropdown for versions
│   ├── ViewportIndicator.tsx           # Shows current viewport size
│   └── TopBar.tsx                      # Header with controls
├── lib/
│   ├── auth.ts                         # Auth utilities
│   ├── comments.ts                     # Comment CRUD operations
│   ├── selectors.ts                    # CSS selector generation
│   ├── projects.ts                     # Project configuration
│   └── kv.ts                           # Vercel KV client
├── middleware.ts                        # Auth check middleware
├── projects.config.ts                   # Project definitions
└── tailwind.config.ts
```

---

## Environment Variables

```bash
# .env.local

# Vercel KV
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Admin password (same for all projects)
PINUP_ADMIN_PASSWORD=your-secure-admin-password

# Optional: Base URL for prototypes if hosted elsewhere
PROTOTYPE_BASE_URL=
```

---

## Screen Specifications

### Screen 1: Login Page

**Route**: `/[project]/login`

**Layout**:
- Centred card, max-width 400px
- PinUp logo (📌 emoji + "PinUp" text)
- "Prototype Review" subtitle
- Password input field
- Name input field (for comment attribution)
- "Enter Review →" button

**Behaviour**:
- On submit, POST to `/api/auth/login` with `{ projectId, password, name }`
- If valid client password → set cookie, redirect to `/[project]`
- If valid admin password → set cookie with admin flag, redirect to `/[project]`
- If invalid → show error "Invalid password"

**Validation**:
- Password: required
- Name: required, min 2 characters

---

### Screen 2a: Main Interface — Panel Collapsed (Default)

**Route**: `/[project]`

**Layout**:
- **Top bar** (sticky, dark background):
  - Left: 📌 logo + project name
  - Centre/Right: Viewport indicator badge (e.g., "Desktop 1440px")
  - Right: Version switcher dropdown
  - Right: "💬 Comments (n)" button (orange)
  - Right (admin only): "📋 Export" button
- **Main area**: 
  - Prototype loaded in iframe (full width/height minus top bar)
  - Subtle hint at bottom: "💡 Click anywhere to add a comment"

**Key behaviour**:
- Comment dots are NOT visible when panel is collapsed
- Clicking on prototype still triggers add comment modal
- Clean viewing experience for reviewing without visual clutter

---

### Screen 2b: Main Interface — Panel Open

**Layout**:
- Same top bar, but "Comments" button changes to "✕ Close"
- **Prototype area**: Reduced width to accommodate panel
- **Comment panel** (right sidebar, 320px width):
  - Header: "Comments (n)" + version filter indicator
  - List of CommentCard components
  - Admin only: Export section at bottom

**Desktop behaviour**:
- Panel slides in from right
- Prototype area shrinks
- Comment dots appear on prototype elements

**Mobile behaviour** (< 768px):
- Panel is full-screen overlay
- Prototype hidden when panel open
- Close button returns to prototype view

---

### Screen 3: Add Comment Modal

**Trigger**: Click on any element in prototype iframe

**Layout**:
- Modal overlay (centred, max-width 400px)
- Shows clicked element selector as badge
- Textarea for feedback (placeholder: "What's your thought on this element?")
- Cancel button (secondary)
- "Pin Comment 📌" button (primary, orange)

**Data captured on click**:
- CSS selector path to element
- Element's inner text (truncated to 100 chars)
- Click position within element (x%, y%)
- Current viewport dimensions
- Device type derived from width

**Behaviour**:
- On submit, POST to `/api/comments`
- On success, close modal, refresh comments
- On cancel, close modal, no action

---

### Screen 4: Delete Confirmation Dialog

**Trigger**: Click delete (🗑) button on comment

**Layout**:
- Modal overlay (centred, max-width 350px)
- 🗑 icon
- "Delete Comment?" heading
- Preview of comment (text + author + selector)
- "This action cannot be undone." warning
- Cancel button (secondary)
- Delete button (red)

**Behaviour**:
- On confirm, DELETE to `/api/comments/[id]`
- On success, close dialog, refresh comments
- On cancel, close dialog

**Permission check**:
- Client: Can only delete if `comment.authorName === session.userName`
- Admin: Can delete any comment

---

### Screen 5: Export (Admin Only)

**Trigger**: Click "📋 Export" or "Copy All for Cursor" button

**Behaviour**:
1. GET `/api/export?project=[id]&version=[id]`
2. Returns markdown string
3. Copy to clipboard
4. Show toast: "Copied to clipboard!"

**Export format**:

```markdown
## PinUp Feedback Export
**Project:** [Project Name]
**Version:** [Version Label]
**Exported:** [Date/Time]
**Comments:** [n] items

---

### 📌 Comment #1
**Element:** `[CSS Selector]`
**Element Text:** "[Truncated text]"
**Viewport:** [Device Type] ([Width]px)
**Author:** [Name]

**Feedback:**
"[Comment text]"

**Suggested action:**
[Auto-generated suggestion based on element type and feedback]

---

[Repeat for each comment]

---
*Exported from PinUp*
```

---

## Component Specifications

### PrototypeFrame

```typescript
interface PrototypeFrameProps {
  url: string;
  onElementClick: (data: ElementClickData) => void;
  showDots: boolean;
  comments: Comment[];
}

interface ElementClickData {
  selector: string;
  elementText: string;
  clickX: number;
  clickY: number;
  viewportWidth: number;
  viewportHeight: number;
}
```

**Implementation notes**:
- Use iframe with `src={url}`
- Inject script into iframe to capture clicks and generate selectors
- Use `postMessage` to communicate between iframe and parent
- Overlay dots are positioned absolutely over iframe based on element positions

### CommentDot

```typescript
interface CommentDotProps {
  number: number;
  position: { top: number; left: number };
  onClick: () => void;
}
```

**Styling**:
- 24px circle, orange (#f97316)
- White border, subtle shadow
- White number centred
- Hover: slight scale up

### CommentPanel

```typescript
interface CommentPanelProps {
  isOpen: boolean;
  comments: Comment[];
  currentUser: { name: string; type: 'client' | 'admin' };
  onClose: () => void;
  onDeleteComment: (id: string) => void;
  onExport?: () => void;  // Only passed for admin
}
```

### CommentCard

```typescript
interface CommentCardProps {
  comment: Comment;
  number: number;
  canDelete: boolean;
  isOwnComment: boolean;
  onDelete: () => void;
  onHover: () => void;    // Highlight corresponding dot
}
```

**Display**:
- Numbered dot matching prototype
- Author name (+ "you" badge if own comment)
- Comment text
- Element selector in monospace badge
- Delete button (if canDelete)

### VersionSwitcher

```typescript
interface VersionSwitcherProps {
  versions: ProjectVersion[];
  currentVersionId: string;
  onChange: (versionId: string) => void;
}
```

**Behaviour**:
- Dropdown/select element
- On change, update URL param and reload prototype
- Comments filter to new version

### ViewportIndicator

```typescript
interface ViewportIndicatorProps {
  width: number;
  height: number;
}
```

**Display logic**:
- width < 768 → "Mobile [width]px"
- width < 1024 → "Tablet [width]px"
- width >= 1024 → "Desktop [width]px"

**Styling**: Blue badge in top bar

---

## API Specifications

### POST /api/auth/login

**Request**:
```json
{
  "projectId": "hotel-booking",
  "password": "client-or-admin-password",
  "name": "Sarah"
}
```

**Response (success)**:
```json
{
  "success": true,
  "userType": "client" | "admin"
}
```
Sets HttpOnly cookie with session data.

**Response (failure)**:
```json
{
  "success": false,
  "error": "Invalid password"
}
```

---

### GET /api/comments

**Query params**:
- `projectId` (required)
- `versionId` (required)

**Response**:
```json
{
  "comments": [
    {
      "id": "uuid",
      "projectId": "hotel-booking",
      "versionId": "v3",
      "createdAt": "2025-01-28T14:30:00Z",
      "authorName": "Sarah",
      "authorType": "client",
      "text": "Headline feels too generic",
      "elementSelector": ".hero-section h1",
      "elementText": "Book your perfect getaway",
      "clickX": 50,
      "clickY": 50,
      "viewportWidth": 1440,
      "viewportHeight": 900,
      "deviceType": "desktop"
    }
  ]
}
```

---

### POST /api/comments

**Request**:
```json
{
  "projectId": "hotel-booking",
  "versionId": "v3",
  "text": "Headline feels too generic",
  "elementSelector": ".hero-section h1",
  "elementText": "Book your perfect getaway",
  "clickX": 50,
  "clickY": 50,
  "viewportWidth": 1440,
  "viewportHeight": 900
}
```

**Response**:
```json
{
  "success": true,
  "comment": { ... }
}
```

---

### DELETE /api/comments/[id]

**Authorization**:
- Client: Must be comment author
- Admin: Can delete any

**Response**:
```json
{
  "success": true
}
```

---

### GET /api/export

**Query params**:
- `projectId` (required)
- `versionId` (required)

**Authorization**: Admin only

**Response**: Plain text markdown (Content-Type: text/plain)

---

## CSS Selector Generation

When user clicks an element, generate a unique CSS selector:

```typescript
function generateSelector(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    // Prefer ID if available
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }
    
    // Add class if meaningful (not utility classes)
    const meaningfulClasses = Array.from(current.classList)
      .filter(c => !c.match(/^(flex|grid|p-|m-|w-|h-|text-|bg-)/))
      .slice(0, 2);
    
    if (meaningfulClasses.length) {
      selector += `.${meaningfulClasses.join('.')}`;
    }
    
    // Add nth-child if needed for uniqueness
    const siblings = current.parentElement?.children;
    if (siblings && siblings.length > 1) {
      const index = Array.from(siblings).indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}
```

---

## Vercel KV Storage Schema

**Keys**:
- `project:{projectId}:comments` → Set of comment IDs
- `comment:{commentId}` → JSON string of Comment object

**Operations**:
```typescript
// Add comment
await kv.set(`comment:${id}`, JSON.stringify(comment));
await kv.sadd(`project:${projectId}:version:${versionId}:comments`, id);

// Get comments for version
const ids = await kv.smembers(`project:${projectId}:version:${versionId}:comments`);
const comments = await Promise.all(ids.map(id => kv.get(`comment:${id}`)));

// Delete comment
await kv.del(`comment:${id}`);
await kv.srem(`project:${projectId}:version:${versionId}:comments`, id);
```

---

## Project Configuration Example

```typescript
// projects.config.ts

export const projects: Record<string, Project> = {
  "hotel-booking": {
    id: "hotel-booking",
    name: "Hotel Booking Prototype",
    clientPassword: "hotel-review-2025",
    versions: [
      { id: "v1", label: "V1 - Initial", url: "/prototypes/hotel-v1" },
      { id: "v2", label: "V2 - Post-feedback", url: "/prototypes/hotel-v2" },
      { id: "v3", label: "V3 - Current", url: "/prototypes/hotel-v3" }
    ]
  },
  "dashboard": {
    id: "dashboard",
    name: "Analytics Dashboard",
    clientPassword: "dash-q1-review",
    versions: [
      { id: "v1", label: "V1 - Concept", url: "https://dashboard-proto.vercel.app" }
    ]
  }
};
```

---

## Responsive Breakpoints

| Breakpoint | Width | Panel Behaviour |
|------------|-------|-----------------|
| Mobile | < 768px | Full-screen overlay |
| Tablet | 768px - 1023px | Sidebar, 280px |
| Desktop | ≥ 1024px | Sidebar, 320px |

---

## Accessibility Requirements

- All interactive elements keyboard accessible
- Focus trap in modals
- Escape key closes modals/panel
- ARIA labels on icon buttons
- Sufficient colour contrast (4.5:1 minimum)
- Screen reader announcements for actions

---

## Error States

| Scenario | Behaviour |
|----------|-----------|
| Invalid project ID | Redirect to 404 page |
| Invalid password | Show inline error on login form |
| Session expired | Redirect to login page |
| Failed to load comments | Show error banner with retry button |
| Failed to save comment | Show toast with error, keep modal open |
| Failed to delete | Show toast with error |
| Prototype failed to load | Show error state in iframe area |

---

## Future Considerations (Out of Scope for MVP)

- Comment threading/replies
- Comment resolution status
- Email notifications
- Annotation drawing tools
- Session recording
- Approval workflows
- Multiple admin accounts with different permissions

---

## Deployment Checklist

1. Create Vercel project
2. Add Vercel KV store
3. Set environment variables:
   - `PINUP_ADMIN_PASSWORD`
   - KV credentials (auto-added by Vercel)
4. Configure custom domain (optional)
5. Add first project to `projects.config.ts`
6. Deploy

---

## Testing Scenarios

### Authentication
- [ ] Client can login with project password
- [ ] Admin can login with global password
- [ ] Invalid password shows error
- [ ] Session persists across page refresh
- [ ] Logout clears session

### Comments
- [ ] Can add comment on any element
- [ ] Comment shows in panel
- [ ] Dot appears on element (when panel open)
- [ ] Client can delete own comment
- [ ] Client cannot delete others' comments
- [ ] Admin can delete any comment
- [ ] Delete confirmation appears
- [ ] Dots hidden when panel closed

### Versions
- [ ] Can switch between versions
- [ ] Comments filter to current version
- [ ] Dots only show for current version

### Export
- [ ] Export button only visible to admin
- [ ] Export generates correct markdown
- [ ] Copy to clipboard works
- [ ] All comments included in export

### Responsive
- [ ] Mobile: panel is overlay
- [ ] Desktop: panel is sidebar
- [ ] Viewport indicator shows correct size
