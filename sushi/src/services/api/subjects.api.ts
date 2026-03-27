/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// SUBJECTS API
// ==========================================

import { api } from "./client";
import type {
  Subject,
  CreateSubjectDTO,
  UpdateSubjectDTO,
  FilterParams,
} from "@/types";

/**
 * Normalise l'objet Subject provenant de l'API (MongoDB _id -> id)
 */
const normalizeSubject = (data: any): Subject => ({
  ...data,
  id: data.id || data._id,
});

// GET /subjects
export const apiGetAllSubjects = async (
  params?: FilterParams,
): Promise<Subject[]> => {
  const response = await api.get<any>("/subjects", { params });
  const result = response.data.data;

  let subjects: any[] = [];
  if (Array.isArray(result)) {
    subjects = result;
  } else if (
    result &&
    typeof result === "object" &&
    Array.isArray(result.subjects)
  ) {
    subjects = result.subjects;
  }

  return subjects.map(normalizeSubject);
};

// GET /subjects/:id
export const apiGetSubjectById = async (
  id: string,
): Promise<Subject | undefined> => {
  const response = await api.get<any>(`/subjects/${id}`);
  const data = response.data.data;
  return data ? normalizeSubject(data) : undefined;
};

// POST /subjects
export const apiCreateSubject = async (
  data: CreateSubjectDTO,
): Promise<Subject> => {
  const response = await api.post<any>("/subjects", data);
  return normalizeSubject(response.data.data);
};

// PUT /subjects/:id
export const apiUpdateSubject = async (
  id: string,
  data: UpdateSubjectDTO,
): Promise<Subject | undefined> => {
  const response = await api.put<any>(`/subjects/${id}`, data);
  const result = response.data.data;
  return result ? normalizeSubject(result) : undefined;
};

// DELETE /subjects/:id
export const apiDeleteSubject = async (id: string): Promise<boolean> => {
  await api.delete(`/subjects/${id}`);
  return true;
};
