/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// GRADES API
// ==========================================

import { api } from "./client";
import type { Grade, GradeFilterParams } from "@/types";

// GET /grades
export const apiGetAllGrades = async (
  params?: GradeFilterParams,
): Promise<Grade[]> => {
  const response = await api.get<Grade[]>("/grades", { params });
  return response.data.data || [];
};

// GET /grades/student/:studentId
export const apiGetGradesByStudent = async (
  studentId: string,
): Promise<Grade[]> => {
  const response = await api.get<Grade[]>(`/grades/student/${studentId}`);
  return response.data.data || [];
};

// GET /grades/class/:classId
export const apiGetGradesByClass = async (
  classId: string,
): Promise<Grade[]> => {
  const response = await api.get<Grade[]>(`/grades/class/${classId}`);
  return response.data.data || [];
};

// GET /grades/student/:studentId (with trimester param)
export const apiGetGradesByStudentAndTrimester = async (
  studentId: string,
  trimester: number,
): Promise<Grade[]> => {
  const response = await api.get<Grade[]>(`/grades/student/${studentId}`, {
    params: { trimester },
  });
  return response.data.data || [];
};

// GET /grades/student/:studentId/average
export const apiCalculateStudentAverage = async (
  studentId: string,
  trimester: number,
): Promise<number> => {
  const response = await api.get<any>(`/grades/student/${studentId}/average`, {
    params: { trimester },
  });
  return response.data.data?.moyenne || 0;
};

// POST /grades
export const apiCreateGrade = async (
  grade: Omit<Grade, "id">,
): Promise<Grade> => {
  const response = await api.post<Grade>("/grades", grade);
  return response.data.data!;
};

// POST /grades/bulk
export const apiBulkCreateGrades = async (
  grades: Partial<Grade>[],
): Promise<any> => {
  const response = await api.post<any>("/grades/bulk", grades);
  return response.data.data;
};

// PUT /grades/:id
export const apiUpdateGrade = async (
  id: string,
  grade: Partial<Grade>,
): Promise<Grade | undefined> => {
  const response = await api.put<Grade>(`/grades/${id}`, grade);
  return response.data.data;
};

// GET /grades/ranking
export const apiGetRanking = async (
  params?: GradeFilterParams,
): Promise<any[]> => {
  const response = await api.get<any[]>("/grades/ranking", { params });
  return response.data.data || [];
};

// GET /grades/averages
export const apiGetSchoolAverages = async (
  academicYear?: string,
): Promise<any[]> => {
  const response = await api.get<any[]>("/grades/averages", {
    params: { academicYear },
  });
  return response.data.data || [];
};

// DELETE /grades/:id
export const apiDeleteGrade = async (id: string): Promise<boolean> => {
  await api.delete(`/grades/${id}`);
  return true;
};
