import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { CopyButton } from './copy-button';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function GuidePage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  const cursorPrompt = `I need to prepare my prototype for upload to PinUp. Please help me:

1. **Check the build configuration:**
   - If this is a Vite/React/Vue project, update vite.config.js to use relative base path:
     \`\`\`js
     export default defineConfig({
       base: './',
     })
     \`\`\`
   - If using React Router, switch from BrowserRouter to HashRouter

2. **Verify asset paths:**
   - Ensure all CSS/JS/image references use relative paths (./assets/ not /assets/)
   - Check for any hardcoded absolute URLs

3. **Build and package:**
   - Run the build command (npm run build)
   - Create a ZIP file of the dist/build folder contents
   - Make sure index.html is at the root of the ZIP

4. **Validate the ZIP:**
   - Confirm index.html exists at root level
   - Check that all assets are included
   - Verify the ZIP is under 50MB

Please analyze my project and make the necessary changes, then create the ZIP file for me.`;

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Header */}
      <header className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Logo size={40} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                Getting Started Guide
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Everything you need to know about PinUp
              </p>
            </div>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* What is PinUp */}
        <section className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            What is PinUp?
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
            PinUp is a prototype review platform that lets your clients leave contextual feedback 
            directly on your design prototypes. Comments are pinned to specific elements, capturing 
            CSS selectors and viewport information — making feedback actionable for developers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[var(--surface-card-alt)] rounded-[var(--radius-md)]">
              <div className="w-10 h-10 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)] mb-1">Pin Comments</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Click any element to leave feedback pinned to that exact spot
              </p>
            </div>
            <div className="p-4 bg-[var(--surface-card-alt)] rounded-[var(--radius-md)]">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)] mb-1">Export for Dev</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Export comments as markdown ready for Cursor or Claude Code
              </p>
            </div>
            <div className="p-4 bg-[var(--surface-card-alt)] rounded-[var(--radius-md)]">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)] mb-1">Version Control</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Upload multiple versions and compare feedback across iterations
              </p>
            </div>
          </div>
        </section>

        {/* How to Use */}
        <section className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            How to Use PinUp
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">Create a Project</h3>
                <p className="text-[var(--text-secondary)]">
                  From your dashboard, click &quot;+ New Project&quot;. Give it a name and set a client password 
                  that you&apos;ll share with reviewers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">Upload Your Prototype</h3>
                <p className="text-[var(--text-secondary)]">
                  Prepare your prototype as a ZIP file (see below), then upload it from the project page. 
                  The ZIP must contain an <code className="px-1 py-0.5 bg-[var(--surface-card-alt)] rounded text-sm">index.html</code> at the root.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">Share with Clients</h3>
                <p className="text-[var(--text-secondary)]">
                  Send your client the project URL and password. They&apos;ll enter their name to start reviewing. 
                  You can view the project directly from your dashboard without needing to log in again.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">Collect & Export Feedback</h3>
                <p className="text-[var(--text-secondary)]">
                  Review comments in the side panel. When ready, use the Export button to copy all feedback 
                  as markdown — perfect for pasting into Cursor or Claude Code.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preparing Prototypes */}
        <section className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Preparing Your Prototype
          </h2>
          
          <div className="space-y-4 text-[var(--text-secondary)]">
            <p>
              For PinUp to display your prototype correctly, it needs to work when served from a subdirectory. 
              Here&apos;s what to check:
            </p>

            <div className="bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] p-4">
              <h3 className="font-medium text-[var(--text-primary)] mb-2">For Vite/React/Vue Projects:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Set <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">base: &apos;./&apos;</code> in vite.config.js</li>
                <li>Use <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">HashRouter</code> instead of BrowserRouter (React Router)</li>
                <li>Run <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">npm run build</code> after changes</li>
                <li>ZIP the contents of the <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">dist</code> folder</li>
              </ul>
            </div>

            <div className="bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] p-4">
              <h3 className="font-medium text-[var(--text-primary)] mb-2">For Plain HTML:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Use relative paths: <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">./assets/</code> not <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">/assets/</code></li>
                <li>ZIP your HTML file and all assets together</li>
                <li>Ensure <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">index.html</code> is at the ZIP root</li>
              </ul>
            </div>

            <div className="bg-[var(--surface-card-alt)] rounded-[var(--radius-md)] p-4">
              <h3 className="font-medium text-[var(--text-primary)] mb-2">ZIP Requirements:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Must contain <code className="px-1 py-0.5 bg-[var(--surface-bg)] rounded">index.html</code> at root level</li>
                <li>Maximum file size: 50MB</li>
                <li>Allowed: HTML, CSS, JS, images, fonts, audio, video</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cursor/Claude Prompt */}
        <section className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Prompt for Cursor / Claude Code
            </h2>
          </div>
          
          <p className="text-[var(--text-secondary)] mb-4">
            Copy this prompt and paste it into Cursor or Claude Code when working on your prototype project. 
            It will help prepare your prototype for upload to PinUp.
          </p>

          <div className="relative">
            <pre className="bg-[var(--surface-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 text-sm text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap">
              {cursorPrompt}
            </pre>
            <CopyButton text={cursorPrompt} />
          </div>
        </section>

        {/* Tips */}
        <section className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-purple-500/10 rounded-[var(--radius-lg)] border border-[var(--accent-primary)]/20 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            💡 Pro Tips
          </h2>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">•</span>
              <span>Use version labels like &quot;V1 - Initial Concept&quot; or &quot;V2 - Post-Feedback&quot; to track iterations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">•</span>
              <span>Comments panel closed = normal browsing. Panel open = comment mode with dots visible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">•</span>
              <span>Export feedback as markdown and paste directly into your AI coding assistant</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">•</span>
              <span>Each version has its own comment thread — perfect for A/B comparisons</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
