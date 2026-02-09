import Link from 'next/link';
import { Logo } from '@/components/logo';
import { getTeamMembers, TeamMember } from '@/lib/admins';

// Force dynamic rendering so new team members appear immediately
export const dynamic = 'force-dynamic';

/**
 * Generate initials from a name (up to 2 characters)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a consistent color based on name
 */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-pink-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Team member card component
 */
function TeamMemberCard({ member }: { member: TeamMember }) {
  const initials = getInitials(member.name);
  const avatarColor = getAvatarColor(member.name);
  
  return (
    <Link
      href={`/admin/login?email=${encodeURIComponent(member.email)}`}
      className="group flex items-center gap-4 p-4 bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:shadow-lg transition-all"
    >
      {/* Avatar */}
      <div className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md`}>
        {initials}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
          {member.name}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {member.projectCount} project{member.projectCount !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Arrow */}
      <svg 
        className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/**
 * Root landing page - shows team members who use PinUp
 */
export default async function HomePage() {
  const teamMembers = await getTeamMembers();

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size={80} />
            </div>
            <p className="text-[var(--text-secondary)] mt-2">
              Prototype Review Platform
            </p>
          </div>

          {/* Team Members */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider px-1">
              Team
            </h2>
            
            {teamMembers.length === 0 ? (
              <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--surface-card-alt)] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[var(--text-secondary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)]">
                  No team members yet
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Contact an administrator to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <Link
              href="/admin/signup"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              New here? Create an account →
            </Link>
          </div>
        </div>
      </main>

      {/* Equator Logo Footer */}
      <footer className="py-6 text-center">
        <img 
          src="/equator-logo.png" 
          alt="Equator" 
          className="h-4 opacity-40 mx-auto"
        />
      </footer>
    </div>
  );
}
