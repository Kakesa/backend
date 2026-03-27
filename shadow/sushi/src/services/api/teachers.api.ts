/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// TEACHERS API
// ==========================================

import { api } from "./client";
import type { Teacher, FilterParams } from "@/types";

/**
 * Normalise l'objet Teacher provenant de l'API (MongoDB _id -> id)
 */
const normalizeTeacher = (data: any): Teacher => ({
  ...data,
  id: data.id || data._id,
});

// GET /teachers
export const apiGetAllTeachers = async (
  params?: FilterParams,
): Promise<Teacher[]> => {
  const response = await api.get<any>("/teachers", { params });
  const result = response.data.data;

  let teachers: any[] = [];
  if (Array.isArray(result)) {
    teachers = result;
  } else if (
    result &&
    typeof result === "object" &&
    "teachers" in result &&
    Array.isArray(result.teachers)
  ) {
    teachers = result.teachers;
  }

  return teachers.map(normalizeTeacher);
};

// GET /teachers/:id
export const apiGetTeacherById = async (
  id: string,
): Promise<Teacher | undefined> => {
  const response = await api.get<any>(`/teachers/${id}`);
  const data = response.data.data;
  return data ? normalizeTeacher(data) : undefined;
};

// GET /teachers/me
export const apiGetMyTeacherProfile = async (): Promise<
  Teacher | undefined
> => {
  const response = await api.get<any>("/teachers/me");
  const data = response.data.data;
  return data ? normalizeTeacher(data) : undefined;
};

// POST /teachers
export const apiCreateTeacher = async (
  teacher: Omit<Teacher, "id">,
): Promise<Teacher> => {
  const response = await api.post<any>("/teachers", teacher);
  return normalizeTeacher(response.data.data);
};

// PUT /teachers/:id
export const apiUpdateTeacher = async (
  id: string,
  teacher: Partial<Teacher>,
): Promise<Teacher | undefined> => {
  const response = await api.put<any>(`/teachers/${id}`, teacher);
  const result = response.data.data;
  return result ? normalizeTeacher(result) : undefined;
};

// DELETE /teachers/:id
export const apiDeleteTeacher = async (id: string): Promise<boolean> => {
  await api.delete(`/teachers/${id}`);
  return true;
};
