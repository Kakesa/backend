/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// USERS API
// ==========================================

import { api } from "./client";
import type { User, CreateUserDTO, UpdateUserDTO } from "@/types";

// GET /users
export const apiGetAllUsers = async (params?: {
  schoolId?: string;
  role?: string;
  status?: string;
}): Promise<User[]> => {
  const response = await api.get<User[] | { users: User[] }>("/users", {
    params,
  });
  const result = response.data.data;

  // Normalize _id to id
  const users = Array.isArray(result) ? result : result.users || [];
  return users.map((user: any) => ({
    ...user,
    id: user.id || user._id,
  }));
};

// GET /users/:id
export const apiGetUserById = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  const user = response.data.data as any;

  return {
    ...user,
    id: user.id || user._id,
  };
};

// POST /users
export const apiCreateUser = async (data: CreateUserDTO): Promise<User> => {
  const response = await api.post<User>("/users", data);
  const user = response.data.data as any;

  return {
    ...user,
    id: user.id || user._id,
  };
};

// PUT /users/:id
export const apiUpdateUser = async (
  id: string,
  data: UpdateUserDTO,
): Promise<User> => {
  const response = await api.put<User>(`/users/${id}`, data);
  const user = response.data.data as any;

  return {
    ...user,
    id: user.id || user._id,
  };
};

// DELETE /users/:id
export const apiDeleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// PUT /users/:id/status
export const apiUpdateUserStatus = async (
  id: string,
  isActive: boolean,
): Promise<User> => {
  const response = await api.put<User>(`/users/${id}/status`, { isActive });
  const user = response.data.data as any;

  return {
    ...user,
    id: user.id || user._id,
  };
};

// GET /users/school/:schoolId
export const apiGetUsersBySchool = async (
  schoolId: string,
): Promise<User[]> => {
  const response = await api.get<User[]>(`/users/school/${schoolId}`);
  const result = response.data.data;

  const users = Array.isArray(result) ? result : [];
  return users.map((user: any) => ({
    ...user,
    id: user.id || user._id,
  }));
};
