'use client';

import { ProjectVersion } from '@/types';

interface VersionSwitcherProps {
  versions: ProjectVersion[];
  currentVersionId: string;
  onChange: (versionId: string) => void;
}

/**
 * Minimal dropdown to switch between prototype versions
 */
export function VersionSwitcher({ 
  versions, 
  currentVersionId, 
  onChange 
}: VersionSwitcherProps) {
  return (
    <select
      value={currentVersionId}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-gray-400 text-[11px] border-none focus:outline-none focus:ring-0 cursor-pointer hover:text-white transition-colors py-1 pr-5 appearance-none"
      aria-label="Select prototype version"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0 center',
        backgroundSize: '14px',
      }}
    >
      {versions.map((version) => (
        <option key={version.id} value={version.id} className="bg-[#2d2d2d] text-gray-300">
          {version.label}
        </option>
      ))}
    </select>
  );
}
