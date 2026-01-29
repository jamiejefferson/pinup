/**
 * Device type derived from viewport width
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * User type for comment attribution
 */
export type UserType = 'client' | 'admin';

/**
 * Represents a comment pinned to an element in a prototype
 */
export interface Comment {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the project */
  projectId: string;
  /** Which version this comment belongs to */
  versionId: string;
  /** ISO timestamp of creation */
  createdAt: string;
  
  // Author information
  /** Name entered at login */
  authorName: string;
  /** Type of user who created the comment */
  authorType: UserType;
  
  // Feedback content
  /** The feedback text */
  text: string;
  
  // Element targeting
  /** CSS selector path to the element */
  elementSelector: string;
  /** Truncated inner text of the element for context (max 100 chars) */
  elementText: string;
  /** X position of click within element (percentage 0-100) */
  clickX: number;
  /** Y position of click within element (percentage 0-100) */
  clickY: number;
  
  // Viewport context
  /** Viewport width when comment was made */
  viewportWidth: number;
  /** Viewport height when comment was made */
  viewportHeight: number;
  /** Derived device type based on viewport width */
  deviceType: DeviceType;
}

/**
 * Data captured when user clicks on an element in the prototype
 */
export interface ElementClickData {
  /** CSS selector path to the clicked element */
  selector: string;
  /** Truncated inner text of the element */
  elementText: string;
  /** X position of click within element (percentage) */
  clickX: number;
  /** Y position of click within element (percentage) */
  clickY: number;
  /** Current viewport width */
  viewportWidth: number;
  /** Current viewport height */
  viewportHeight: number;
}

/**
 * Request body for creating a new comment
 */
export interface CreateCommentRequest {
  projectId: string;
  versionId: string;
  text: string;
  elementSelector: string;
  elementText: string;
  clickX: number;
  clickY: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Helper function to derive device type from viewport width
 */
export function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}
