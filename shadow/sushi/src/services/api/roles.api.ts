/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// ROLES API
// ==========================================

import { api } from "./client";
import type { Role, CreateRoleDTO, UpdateRoleDTO } from "@/types";

// GET /roles
export const apiGetAllRoles = async (params?: {
  schoolId?: string;
}): Promise<Role[]> => {
  const response = await api.get<Role[] | { roles: Role[] }>("/roles", {
    params,
  });
  const result = response.data.data;

  // Normalize _id to id
  const roles = Array.isArray(result) ? result : result.roles || [];
  return roles.map((role: any) => {
    // Transform backend permissions format to frontend format
    const backendPermissions = role.permissions || [];
    const frontendPermissions = backendPermissions.map((perm: any) => {
      const permissions: string[] = [];
      if (perm.canCreate) permissions.push("create");
      if (perm.canRead) permissions.push("read");
      if (perm.canUpdate) permissions.push("update");
      if (perm.canDelete) permissions.push("delete");

      return {
        module: perm.module,
        permissions,
      };
    });

    return {
      ...role,
      id: role.id || role._id,
      schoolId:
        role.schoolId ||
        role.school ||
        (typeof role.school === "object"
          ? role.school.id || role.school._id
          : undefined),
      permissions: frontendPermissions,
      description: role.description || "",
      isSystem: role.isSystem || false,
    };
  });
};

// GET /roles/:id
export const apiGetRoleById = async (id: string): Promise<Role> => {
  const response = await api.get<Role>(`/roles/${id}`);
  const role = response.data.data as any;

  return {
    ...role,
    id: role.id || role._id,
    schoolId:
      role.schoolId ||
      role.school ||
      (typeof role.school === "object"
        ? role.school.id || role.school._id
        : undefined),
  };
};

// POST /roles
export const apiCreateRole = async (data: CreateRoleDTO): Promise<Role> => {
  const response = await api.post<Role>("/roles", data);
  const role = response.data.data as any;

  return {
    ...role,
    id: role.id || role._id,
    schoolId: role.schoolId || role.school,
  };
};

// PUT /roles/:id
export const apiUpdateRole = async (
  id: string,
  data: UpdateRoleDTO,
): Promise<Role> => {
  const response = await api.put<Role>(`/roles/${id}`, data);
  const role = response.data.data as any;

  return {
    ...role,
    id: role.id || role._id,
    schoolId: role.schoolId || role.school,
  };
};

// DELETE /roles/:id
export const apiDeleteRole = async (id: string): Promise<void> => {
  await api.delete(`/roles/${id}`);
};

// PUT /roles/:id/permissions
export const apiUpdateRolePermissions = async (
  id: string,
  permissions: any[],
): Promise<any[]> => {
  const response = await api.put<any[]>(`/roles/${id}/permissions`, {
    permissions,
  });
  return response.data.data;
};

// PUT /roles/users/:userId/role
export const apiAssignRole = async (
  userId: string,
  roleId: string,
): Promise<any> => {
  const response = await api.put<any>(`/roles/users/${userId}/role`, {
    roleId,
  });
  const assignment = response.data.data as any;

  return {
    ...assignment,
    id: assignment.id || assignment._id,
  };
};

// GET /roles/:roleId/users
export const apiGetRoleUsers = async (roleId: string): Promise<any[]> => {
  const response = await api.get<any[]>(`/roles/${roleId}/users`);
  const result = response.data.data;

  const users = Array.isArray(result) ? result : [];
  return users.map((user: any) => ({
    ...user,
    id: user.id || user._id,
  }));
};

// GET /roles/permissions/check
export const apiCheckPermission = async (
  userId: string,
  module: string,
  action: string,
): Promise<boolean> => {
  const response = await api.get<{ hasPermission: boolean }>(
    "/roles/permissions/check",
    {
      params: { userId, module, action },
    },
  );
  return response.data.hasPermission;
};
