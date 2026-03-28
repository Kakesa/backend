/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// SCHEDULE API
// ==========================================

import { api } from "./client";
import type {
  ScheduleSlot,
  Room,
  CreateScheduleSlotDTO,
  UpdateScheduleSlotDTO,
  ConflictResult,
} from "@/types";

const normalizeRoom = (data: any): Room => ({
  ...data,
  id: data.id || data._id,
});

const normalizeScheduleSlot = (data: any): ScheduleSlot => ({
  ...data,
  id: data.id || data._id,
});

// GET /schedule
export const apiGetAllScheduleSlots = async (): Promise<ScheduleSlot[]> => {
  const response = await api.get<any>("/schedule");
  const data = response.data.data || [];
  return Array.isArray(data) ? data.map(normalizeScheduleSlot) : [];
};

// GET /schedule/class/:classId
export const apiGetScheduleByClass = async (
  classId: string,
): Promise<ScheduleSlot[]> => {
  const response = await api.get<any>(`/schedule/class/${classId}`);
  const data = response.data.data || [];
  return Array.isArray(data) ? data.map(normalizeScheduleSlot) : [];
};

// GET /schedule/teacher/:teacherId
export const apiGetScheduleByTeacher = async (
  teacherId: string,
): Promise<ScheduleSlot[]> => {
  const response = await api.get<any>(`/schedule/teacher/${teacherId}`);
  const data = response.data.data || [];
  return Array.isArray(data) ? data.map(normalizeScheduleSlot) : [];
};

// GET /schedule/room/:room
export const apiGetScheduleByRoom = async (
  room: string,
): Promise<ScheduleSlot[]> => {
  const response = await api.get<any>(
    `/schedule/room/${encodeURIComponent(room)}`,
  );
  const data = response.data.data || [];
  return Array.isArray(data) ? data.map(normalizeScheduleSlot) : [];
};

// POST /schedule/check-conflicts
export const apiCheckScheduleConflicts = async (
  slot: Omit<ScheduleSlot, "id">,
  excludeId?: string,
): Promise<ConflictResult> => {
  const response = await api.post<ConflictResult>("/schedule/check-conflicts", {
    slot,
    excludeId,
  });
  const data = response.data.data!;
  if (data.conflictingSlot) {
    data.conflictingSlot = normalizeScheduleSlot(data.conflictingSlot);
  }
  return data;
};

// POST /schedule
export const apiCreateScheduleSlot = async (
  data: CreateScheduleSlotDTO,
): Promise<ScheduleSlot | ConflictResult> => {
  const response = await api.post<any>("/schedule", data);
  const result = response.data.data!;
  if ((result as any).hasConflict) {
    if ((result as any).conflictingSlot) {
      (result as any).conflictingSlot = normalizeScheduleSlot(
        (result as any).conflictingSlot,
      );
    }
    return result as ConflictResult;
  }
  return normalizeScheduleSlot(result);
};

// PUT /schedule/:id
export const apiUpdateScheduleSlot = async (
  id: string,
  data: UpdateScheduleSlotDTO,
): Promise<ScheduleSlot | ConflictResult | undefined> => {
  const response = await api.put<any>(`/schedule/${id}`, data);
  const result = response.data.data;
  if (!result) return undefined;
  if ((result as any).hasConflict) {
    if ((result as any).conflictingSlot) {
      (result as any).conflictingSlot = normalizeScheduleSlot(
        (result as any).conflictingSlot,
      );
    }
    return result as ConflictResult;
  }
  return normalizeScheduleSlot(result);
};

// DELETE /schedule/:id
export const apiDeleteScheduleSlot = async (id: string): Promise<boolean> => {
  await api.delete(`/schedule/${id}`);
  return true;
};

// ==========================================
// ROOMS API
// ==========================================

// GET /rooms
export const apiGetAllRooms = async (): Promise<Room[]> => {
  const response = await api.get<any>("/rooms");
  return (response.data.data || []).map(normalizeRoom);
};

// GET /rooms/available
export const apiGetAvailableRooms = async (
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): Promise<Room[]> => {
  const response = await api.get<any>("/rooms/available", {
    params: { dayOfWeek, startTime, endTime },
  });
  return (response.data.data || []).map(normalizeRoom);
};

// POST /rooms
export const apiCreateRoom = async (data: Omit<Room, "id">): Promise<Room> => {
  const response = await api.post<any>("/rooms", data);
  return normalizeRoom(response.data.data!);
};

// PUT /rooms/:id
export const apiUpdateRoom = async (
  id: string,
  data: Partial<Room>,
): Promise<Room | undefined> => {
  const response = await api.put<any>(`/rooms/${id}`, data);
  const result = response.data.data;
  return result ? normalizeRoom(result) : undefined;
};

// DELETE /rooms/:id
export const apiDeleteRoom = async (id: string): Promise<boolean> => {
  await api.delete(`/rooms/${id}`);
  return true;
};

// GET /schedule/me
export const apiGetMySchedule = async (): Promise<ScheduleSlot[]> => {
  const response = await api.get<any>("/schedule/me");
  const data = response.data.data || [];
  return Array.isArray(data) ? data.map(normalizeScheduleSlot) : [];
};
