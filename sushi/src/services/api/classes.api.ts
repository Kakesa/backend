/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// CLASSES API
// ==========================================

import { api } from "./client";
import { addSchoolIdToParams, addSchoolIdToBody } from "@/lib/apiHelper";
import type {
  Class,
  CreateClassDTO,
  UpdateClassDTO,
  FilterParams,
} from "@/types";

/**
 * Normalise l'objet Class provenant de l'API (MongoDB _id -> id)
 */
const normalizeClass = (data: any): Class => ({
  ...data,
  id: data.id || data._id,
});

// GET /classes
export const apiGetAllClasses = async (
  params?: FilterParams,
): Promise<Class[]> => {
  // Ajout automatique du schoolId pour l'isolation multi-tenant
  const paramsWithSchool = addSchoolIdToParams(params);
  const response = await api.get<any>("/classes", { params: paramsWithSchool });
  const result = response.data.data;

  let classes: any[] = [];
  if (Array.isArray(result)) {
    classes = result;
  } else if (
    result &&
    typeof result === "object" &&
    Array.isArray(result.classes)
  ) {
    classes = result.classes;
  }

  return classes.map(normalizeClass);
};

// GET /classes/:id
export const apiGetClassById = async (
  id: string,
): Promise<Class | undefined> => {
  const response = await api.get<any>(`/classes/${id}`);
  const data = response.data.data;
  return data ? normalizeClass(data) : undefined;
};

// GET /classes/level/:level
export const apiGetClassesByLevel = async (level: string): Promise<Class[]> => {
  const paramsWithSchool = addSchoolIdToParams({ level });
  const response = await api.get<any>(`/classes/level/${level}`, { params: paramsWithSchool });
  const result = response.data.data || [];
  return Array.isArray(result) ? result.map(normalizeClass) : [];
};

// POST /classes
export const apiCreateClass = async (data: CreateClassDTO): Promise<Class> => {
  // Ajout automatique du schoolId pour l'isolation multi-tenant
  const dataWithSchool = addSchoolIdToBody(data);
  const response = await api.post<any>("/classes", dataWithSchool);
  return normalizeClass(response.data.data);
};

// PUT /classes/:id
export const apiUpdateClass = async (
  id: string,
  data: UpdateClassDTO,
): Promise<Class | undefined> => {
  // Ajout automatique du schoolId pour l'isolation multi-tenant
  const dataWithSchool = addSchoolIdToBody(data);
  const response = await api.put<any>(`/classes/${id}`, dataWithSchool);
  const result = response.data.data;
  return result ? normalizeClass(result) : undefined;
};

// DELETE /classes/:id
export const apiDeleteClass = async (id: string): Promise<boolean> => {
  await api.delete(`/classes/${id}`);
  return true;
};
