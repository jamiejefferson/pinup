/**
 * Represents a version of a prototype within a project
 */
export interface ProjectVersion {
  /** Unique identifier for the version (e.g., "v1", "v2", "v3") */
  id: string;
  /** Display label for the version (e.g., "V1 - Initial", "V2 - Post-feedback") */
  label: string;
  /** URL to the prototype (can be relative path or absolute URL) */
  url: string;
}

/**
 * Represents a project configured for review in PinUp
 */
export interface Project {
  /** URL slug for the project (e.g., "hotel-booking") */
  id: string;
  /** Display name for the project (e.g., "Hotel Booking Prototype") */
  name: string;
  /** Password for client access to this project */
  clientPassword: string;
  /** Available versions of the prototype */
  versions: ProjectVersion[];
}

/**
 * Project configuration map - keyed by project ID
 */
export type ProjectsConfig = Record<string, Project>;
