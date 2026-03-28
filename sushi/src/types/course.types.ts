/* eslint-disable @typescript-eslint/no-empty-object-type */
// ==========================================
// COURSE TYPES
// ==========================================

export interface Course {
  id: string;
  subjectId: string | { _id: string; name: string };
  teacherId: string | { _id: string; firstName: string; lastName: string };
  classId: string | { _id: string; name: string };
  dayOfWeek: number; // 0-6 (Dimanche-Samedi)
  startTime: string;
  endTime: string;
  room: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseDTO {
  subjectId: string;
  teacherId: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
}

export interface UpdateCourseDTO extends Partial<CreateCourseDTO> {}
