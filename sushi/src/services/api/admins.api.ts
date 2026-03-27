// ==========================================
// ADMINS API - SuperAdmin management of school admins
// ==========================================

import apiClient from './client';
import type { SchoolAdmin, CreateAdminDTO, UpdateAdminDTO } from '@/types/admin.types';

// GET /superadmin/admins - Récupère tous les administrateurs d'écoles
export const apiGetAllAdmins = async (): Promise<SchoolAdmin[]> => {
  const response = await apiClient.get<{ data: SchoolAdmin[] }>('/superadmin/admins');
  return response.data.data || response.data as unknown as SchoolAdmin[];
};

// GET /superadmin/admins/:id - Récupère un administrateur par ID
export const apiGetAdminById = async (id: string): Promise<SchoolAdmin | undefined> => {
  const response = await apiClient.get<{ data: SchoolAdmin }>(`/superadmin/admins/${id}`);
  return response.data.data || response.data as unknown as SchoolAdmin;
};

// POST /superadmin/admins - Crée un nouvel administrateur
export const apiCreateAdmin = async (data: CreateAdminDTO): Promise<SchoolAdmin> => {
  const response = await apiClient.post<{ data: SchoolAdmin }>('/superadmin/admins', data);
  return response.data.data || response.data as unknown as SchoolAdmin;
};

// PUT /superadmin/admins/:id - Met à jour un administrateur
export const apiUpdateAdmin = async (id: string, data: UpdateAdminDTO): Promise<SchoolAdmin> => {
  const response = await apiClient.put<{ data: SchoolAdmin }>(`/superadmin/admins/${id}`, data);
  return response.data.data || response.data as unknown as SchoolAdmin;
};

// DELETE /superadmin/admins/:id - Supprime un administrateur
export const apiDeleteAdmin = async (id: string): Promise<void> => {
  await apiClient.delete(`/superadmin/admins/${id}`);
};

// PUT /superadmin/admins/:id/toggle-status - Active/Désactive un admin
export const apiToggleAdminStatus = async (id: string): Promise<SchoolAdmin> => {
  const response = await apiClient.put<{ data: SchoolAdmin }>(`/superadmin/admins/${id}/toggle-status`);
  return response.data.data || response.data as unknown as SchoolAdmin;
};

// POST /superadmin/admins/:id/reset-password - Réinitialise le mot de passe
export const apiResetAdminPassword = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    `/superadmin/admins/${id}/reset-password`
  );
  return response.data;
};
