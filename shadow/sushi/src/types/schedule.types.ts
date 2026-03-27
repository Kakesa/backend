/* eslint-disable @typescript-eslint/no-empty-object-type */
// ==========================================
// SCHEDULE TYPES
// ==========================================

export type RoomType = "classroom" | "lab" | "gym" | "auditorium";

export interface ScheduleSlot {
  id: string;
  courseId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  dayOfWeek: number; // 0-6 (Dimanche-Samedi)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
  color: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: RoomType;
  available: boolean;
  schoolId?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  label: string;
}

export interface Day {
  id: number;
  name: string;
  shortName: string;
}

export interface CreateScheduleSlotDTO {
  courseId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  color: string;
}

export interface UpdateScheduleSlotDTO extends Partial<CreateScheduleSlotDTO> {}

export interface ConflictResult {
  hasConflict: boolean;
  type?: "teacher" | "room" | "class";
  message?: string;
  conflictingSlot?: ScheduleSlot;
}
