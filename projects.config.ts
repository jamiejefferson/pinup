import { Project, ProjectsConfig } from '@/types';

/**
 * PinUp Project Configuration
 * 
 * To add a new project for client review:
 * 1. Add a new entry to this object with a unique ID (URL slug)
 * 2. Set the project name and client password
 * 3. Add prototype versions with their URLs
 * 4. Place prototype files in /public/prototypes/[project-id]/[version-id]/
 * 
 * Example usage with Cursor/Claude:
 * "Add a new project called 'Mobile App Redesign' with password 'mobile-review-2025'"
 */
export const projects: ProjectsConfig = {
  // Example project - Hotel Booking Prototype
  "hotel-booking": {
    id: "hotel-booking",
    name: "Hotel Booking Prototype",
    clientPassword: "hotel-review-2025",
    versions: [
      { 
        id: "v1", 
        label: "V1 - Initial Concept", 
        url: "/prototypes/hotel-booking/v1/index.html" 
      },
      { 
        id: "v2", 
        label: "V2 - Post-feedback", 
        url: "/prototypes/hotel-booking/v2/index.html" 
      },
      { 
        id: "v3", 
        label: "V3 - Current", 
        url: "/prototypes/hotel-booking/v3/index.html" 
      }
    ]
  },

  // Example project - Analytics Dashboard
  "dashboard": {
    id: "dashboard",
    name: "Analytics Dashboard",
    clientPassword: "dash-q1-review",
    versions: [
      { 
        id: "v1", 
        label: "V1 - Concept", 
        url: "/prototypes/dashboard/v1/index.html" 
      }
    ]
  }
};

/**
 * Get a project by its ID
 */
export function getProject(projectId: string): Project | undefined {
  return projects[projectId];
}

/**
 * Get all project IDs
 */
export function getAllProjectIds(): string[] {
  return Object.keys(projects);
}

/**
 * Check if a project exists
 */
export function projectExists(projectId: string): boolean {
  return projectId in projects;
}
