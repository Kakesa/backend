// ==========================================
// PERMISSIONS API
// ==========================================

import { api } from "./client";
import type {
  Role,
  UserWithRole,
  CreateRoleDTO,
  UpdateRoleDTO,
  Module,
  Permission,
} from "@/types";

// GET /roles
export const apiGetAllRoles = async (): Promise<Role[]> => {
  const response = await api.get<Role[]>("/roles");
  return response.data.data || [];
};

// GET /roles/:id
export const apiGetRoleById = async (id: string): Promise<Role | undefined> => {
  const response = await api.get<Role>(`/roles/${id}`);
  return response.data.data;
};

// GET /roles/:roleId/users
export const apiGetUsersByRole = async (
  roleId: string,
): Promise<UserWithRole[]> => {
  const response = await api.get<UserWithRole[]>(`/roles/${roleId}/users`);
  return response.data.data || [];
};

// GET /permissions/check
export const apiCheckPermission = async (
  roleId: string,
  module: Module,
  permission: Permission,
): Promise<boolean> => {
  const response = await api.get<{ hasPermission: boolean }>(
    "/permissions/check",
    {
      params: { roleId, module, permission },
    },
  );
  return response.data.data?.hasPermission || false;
};

// POST /roles
export const apiCreateRole = async (data: CreateRoleDTO): Promise<Role> => {
  const response = await api.post<Role>("/roles", data);
  return response.data.data!;
};

// PUT /roles/:id
export const apiUpdateRole = async (
  id: string,
  data: UpdateRoleDTO,
): Promise<Role | undefined> => {
  const response = await api.put<Role>(`/roles/${id}`, data);
  return response.data.data;
};

// DELETE /roles/:id
export const apiDeleteRole = async (id: string): Promise<boolean> => {
  await api.delete(`/roles/${id}`);
  return true;
};

// PUT /users/:userId/role
export const apiUpdateUserRole = async (
  userId: string,
  roleId: string,
): Promise<UserWithRole | undefined> => {
  const response = await api.put<UserWithRole>(`/users/${userId}/role`, {
    roleId,
  });
  return response.data.data;
};

// GET /users/with-roles
export const apiGetAllUsersWithRoles = async (): Promise<UserWithRole[]> => {
  const response = await api.get<UserWithRole[]>("/users/with-roles");
  return response.data.data || [];
};
