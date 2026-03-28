// ==========================================
// ATTENDANCE TYPES
// ==========================================

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  scanTime: string | null;
  notes: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttendanceDTO {
  studentId: string;
  courseId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  scanTime?: string;
  notes?: string;
}

export interface UpdateAttendanceDTO extends Partial<CreateAttendanceDTO> {}

export interface BulkAttendanceDTO {
  courseId: string;
  date: string;
  attendances: {
    studentId: string;
    status: "present" | "absent" | "late" | "excused";
    scanTime?: string;
    notes?: string;
  }[];
}

export interface AttendanceStats {
  studentId: string;
  totalCourses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}
