/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// ATTENDANCE API
// ==========================================

import { api } from "./client";
import type { Attendance, FilterParams } from "@/types";

// GET /attendance
export const apiGetAllAttendances = async (
  params?: FilterParams,
): Promise<Attendance[]> => {
  const response = await api.get<Attendance[]>("/attendance", { params });
  return response.data.data || [];
};

// GET /attendance/student/:studentId
export const apiGetAttendancesByStudent = async (
  studentId: string,
): Promise<Attendance[]> => {
  const response = await api.get<Attendance[]>(
    `/attendance/student/${studentId}`,
  );
  return response.data.data || [];
};

// GET /attendance/stats/:studentId
export const apiGetAttendanceStats = async (
  studentId: string,
): Promise<{
  present: number;
  absent: number;
  late: number;
  excused: number;
}> => {
  const response = await api.get<any>(`/attendance/stats/${studentId}`);
  return response.data.data!;
};

// POST /attendance
export const apiCreateAttendance = async (
  attendance: Omit<Attendance, "id">,
): Promise<Attendance> => {
  const response = await api.post<Attendance>("/attendance", attendance);
  return response.data.data!;
};

// POST /attendance/scan
export const apiMarkAttendance = async (
  studentId: string,
  courseId: string,
  status: "present" | "absent" | "late",
  scanTime?: string,
): Promise<Attendance> => {
  const response = await api.post<Attendance>("/attendance/scan", {
    studentId,
    courseId,
    status,
    scanTime,
  });
  return response.data.data!;
};
