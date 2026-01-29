'use client';

interface ViewportIndicatorProps {
  width: number;
  height: number;
}

/**
 * Displays the current viewport size with device type badge
 */
export function ViewportIndicator({ width, height }: ViewportIndicatorProps) {
  let deviceType: string;
  let icon: string;

  if (width < 768) {
    deviceType = 'Mobile';
    icon = '📱';
  } else if (width < 1024) {
    deviceType = 'Tablet';
    icon = '📟';
  } else {
    deviceType = 'Desktop';
    icon = '🖥️';
  }

  return (
    <div className="flex items-center gap-1.5 bg-[var(--status-info)] text-white px-2.5 py-1 rounded-full text-xs font-medium">
      <span>{icon}</span>
      <span>{deviceType}</span>
      <span className="opacity-75">{width}px</span>
    </div>
  );
}
