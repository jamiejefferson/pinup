/**
 * Admin account for multi-tenancy
 */
export interface Admin {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

/**
 * Admin with password hash (internal use only)
 */
export interface AdminWithHash extends Admin {
  passwordHash: string;
}

/**
 * Request to create a new admin
 */
export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
  isSuperAdmin?: boolean;
}

/**
 * Request to update an admin
 */
export interface UpdateAdminRequest {
  email?: string;
  name?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
}

/**
 * Activity log entry
 */
export interface AdminActivity {
  id: string;
  adminId: string;
  action: AdminAction;
  details: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Types of admin actions for activity logging
 */
export type AdminAction =
  | 'login'
  | 'logout'
  | 'create_project'
  | 'update_project'
  | 'delete_project'
  | 'upload_version'
  | 'delete_version'
  | 'create_admin'
  | 'update_admin'
  | 'delete_admin'
  | 'reset_password';
