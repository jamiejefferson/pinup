'use client';

import { ProjectVersion, UserType } from '@/types';
import { VersionSwitcher } from './version-switcher';
import { Logo } from './logo';

interface TopBarProps {
  projectName: string;
  versions: ProjectVersion[];
  currentVersionId: string;
  onVersionChange: (versionId: string) => void;
  viewportWidth: number;
  viewportHeight: number;
  commentCount: number;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  userType: UserType;
  onExport?: () => void;
  onLogout: () => void;
}

/**
 * Minimal top bar inspired by Cursor
 */
export function TopBar({
  projectName,
  versions,
  currentVersionId,
  onVersionChange,
  viewportWidth,
  commentCount,
  isPanelOpen,
  onTogglePanel,
  userType,
  onExport,
  onLogout,
}: TopBarProps) {
  return (
    <header className="bg-[#1e1e1e] text-gray-300 border-b border-gray-800">
      <div className="relative flex items-center justify-between px-3 h-10">
        {/* Left: Logo */}
        <div className="flex items-center">
          <button
            onClick={onLogout}
            className="hover:opacity-70 transition-opacity"
            aria-label="Logout"
            title="Logout"
          >
            <Logo size={42} variant="light" />
          </button>
        </div>

        {/* Center: Title and viewport */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="text-[11px] text-gray-300 font-bold truncate max-w-[250px]">
            {projectName}
          </span>
          {userType === 'admin' && (
            <span className="text-[11px] text-pink-400 font-medium">
              ADMIN
            </span>
          )}
          <span className="text-[11px] text-gray-500">
            {viewportWidth}px
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Version Switcher */}
          <VersionSwitcher
            versions={versions}
            currentVersionId={currentVersionId}
            onChange={onVersionChange}
          />

          {/* Divider */}
          <div className="w-px h-4 bg-gray-700 mx-1" />

          {/* Comments Toggle Button */}
          <button
            onClick={onTogglePanel}
            className={`px-2 py-1 text-[11px] transition-colors flex items-center gap-1.5 ${
              isPanelOpen
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            aria-label={isPanelOpen ? 'Close comments panel' : 'Open comments panel'}
            aria-expanded={isPanelOpen}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{commentCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
