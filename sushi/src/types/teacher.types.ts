// ==========================================
// TEACHER TYPES
// ==========================================

export interface Teacher {
  id: string;
  _id?: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: string[];
  mainClassId?: string;
  hireDate: string;
  status: "active" | "inactive";
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeacherDTO {
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: string[];
  mainClassId?: string;
  hireDate: string;
}

export interface UpdateTeacherDTO extends Partial<CreateTeacherDTO> {
  status?: "active" | "inactive";
}
