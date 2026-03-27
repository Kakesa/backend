/* eslint-disable @typescript-eslint/no-empty-object-type */
// ==========================================
// PERMISSION TYPES
// ==========================================

export type Module =
  | "students"
  | "teachers"
  | "courses"
  | "grades"
  | "attendance"
  | "messaging"
  | "reports"
  | "settings"
  | "users"
  | "absences"
  | "competences"
  | "calendar";

export type Permission = "create" | "read" | "update" | "delete";

export interface RolePermission {
  module: Module;
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
  isSystem: boolean; // Rôles système non supprimables
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin: string | null;
}

export interface CreateRoleDTO {
  name: string;
  description: string;
  schoolId: string;
  permissions: RolePermission[];
}

export interface UpdateRoleDTO extends Partial<CreateRoleDTO> {}
