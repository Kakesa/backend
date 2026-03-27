/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// COURSES API
// ==========================================

import { api } from "./client";
import type {
  Course,
  CreateCourseDTO,
  UpdateCourseDTO,
  FilterParams,
} from "@/types";

/**
 * Normalise l'objet Course provenant de l'API (MongoDB _id -> id)
 */
const normalizeCourse = (data: any): Course => ({
  ...data,
  id: data.id || data._id,
});

// GET /courses
export const apiGetAllCourses = async (
  params?: FilterParams,
): Promise<Course[]> => {
  const response = await api.get<any>("/courses", { params });
  const result = response.data.data;

  let courses: any[] = [];
  if (Array.isArray(result)) {
    courses = result;
  } else if (
    result &&
    typeof result === "object" &&
    Array.isArray(result.courses)
  ) {
    courses = result.courses;
  }

  return courses.map(normalizeCourse);
};

// GET /courses/teacher/:teacherId
export const apiGetTeacherCourses = async (
  teacherId: string,
): Promise<Course[]> => {
  const response = await api.get<any>(`/courses/teacher/${teacherId}`);
  const result = response.data.data || [];
  return Array.isArray(result) ? result.map(normalizeCourse) : [];
};

// GET /courses/:id
export const apiGetCourseById = async (
  id: string,
): Promise<Course | undefined> => {
  const response = await api.get<any>(`/courses/${id}`);
  const data = response.data.data;
  return data ? normalizeCourse(data) : undefined;
};

// POST /courses
export const apiCreateCourse = async (
  data: CreateCourseDTO,
): Promise<Course> => {
  const response = await api.post<any>("/courses", data);
  return normalizeCourse(response.data.data);
};

// PUT /courses/:id
export const apiUpdateCourse = async (
  id: string,
  data: UpdateCourseDTO,
): Promise<Course | undefined> => {
  const response = await api.put<any>(`/courses/${id}`, data);
  const result = response.data.data;
  return result ? normalizeCourse(result) : undefined;
};

// DELETE /courses/:id
export const apiDeleteCourse = async (id: string): Promise<boolean> => {
  await api.delete(`/courses/${id}`);
  return true;
};
