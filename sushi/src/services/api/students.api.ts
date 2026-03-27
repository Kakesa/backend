/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// STUDENTS API
// ==========================================

import { api } from "./client";
import { addSchoolIdToParams, addSchoolIdToBody } from "@/lib/apiHelper";
import type { Student, FilterParams } from "@/types";

/**
 * Normalise l'objet Student provenant de l'API (MongoDB _id -> id)
 */
const normalizeStudent = (data: any): Student => ({
  ...data,
  id: data.id || data._id,
});

// GET /students
export const apiGetAllStudents = async (
  params?: FilterParams,
): Promise<Student[]> => {
  // Ajout automatique du schoolId pour l'isolation multi-tenant
  const paramsWithSchool = addSchoolIdToParams(params);
  const response = await api.get<any>("/students", { params: paramsWithSchool });
  const result = response.data.data;

  let students: any[] = [];
  if (Array.isArray(result)) {
    students = result;
  } else if (
    result &&
    typeof result === "object" &&
    Array.isArray(result.students)
  ) {
    students = result.students;
  }

  return students.map(normalizeStudent);
};

// GET /students/:id
export const apiGetStudentById = async (
  id: string,
): Promise<Student | undefined> => {
  const response = await api.get<any>(`/students/${id}`);
  const data = response.data.data;
  return data ? normalizeStudent(data) : undefined;
};

// GET /students/:id/courses
export const apiGetStudentCourses = async (id: string): Promise<any[]> => {
  const response = await api.get<any>(`/students/${id}/courses`);
  return response.data.data || [];
};

// POST /students
export const apiCreateStudent = async (
  student: Omit<Student, "id">,
): Promise<Student> => {
  const response = await api.post<any>("/students", student);
  return normalizeStudent(response.data.data);
};

// PUT /students/:id
export const apiUpdateStudent = async (
  id: string,
  student: Partial<Student>,
): Promise<Student | undefined> => {
  const response = await api.put<any>(`/students/${id}`, student);
  const result = response.data.data;
  return result ? normalizeStudent(result) : undefined;
};

// DELETE /students/:id
export const apiDeleteStudent = async (id: string): Promise<boolean> => {
  await api.delete(`/students/${id}`);
  return true;
};

// GET /students/class/:classId
export const apiGetStudentsByClass = async (
  classId: string,
): Promise<Student[]> => {
  const response = await api.get<any>(`/students`, {
    params: { classId },
  });
  const result = response.data.data;

  let students: any[] = [];
  if (Array.isArray(result)) {
    students = result;
  } else if (
    result &&
    typeof result === "object" &&
    Array.isArray(result.students)
  ) {
    students = result.students;
  }

  return students.map(normalizeStudent);
};
