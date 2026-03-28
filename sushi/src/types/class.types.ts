// ==========================================
// CLASS TYPES
// ==========================================

export interface Class {
  id: string;
  _id?: string;
  name: string;
  level: string;
  section: string;
  academicYear: string;
  mainTeacherId: string;
  studentCount: number;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassDTO {
  name: string;
  level: string;
  section: string;
  academicYear: string;
  mainTeacherId: string;
}

export interface UpdateClassDTO extends Partial<CreateClassDTO> {
  studentCount?: number;
}
