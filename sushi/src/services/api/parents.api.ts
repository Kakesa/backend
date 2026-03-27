/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./client";

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  profession?: string;
  matricule?: string;
  relationship?: string;
  childrenIds?: string[];
  children?: Array<{ id: string; name: string }>;
  userId?: string;
  schoolId: string;
  status: "active" | "inactive";
  registrationDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const apiGetAllParents = async (params?: any): Promise<Parent[]> => {
  const response = await api.get<any>("/parents", { params });
  return response.data.data || [];
};

export const apiGetParentById = async (id: string): Promise<Parent> => {
  const response = await api.get(`/parents/${id}`);
  return response.data.data as Parent;
};

export const apiCreateParent = async (
  data: Partial<Parent>,
): Promise<Parent> => {
  const response = await api.post("/parents", data);
  return response.data.data as Parent;
};

export const apiUpdateParent = async (
  id: string,
  data: Partial<Parent>,
): Promise<Parent> => {
  const response = await api.put(`/parents/${id}`, data);
  return response.data.data as Parent;
};

export const apiDeleteParent = async (id: string): Promise<boolean> => {
  await api.delete(`/parents/${id}`);
  return true;
};
