// ==========================================
// SCHOOL TYPES
// ==========================================

export type SchoolLanguage = "fr" | "en";
export type SchoolStatus = "active" | "inactive";
export type TermSystem = "trimester" | "semester";

export interface SchoolSettings {
  gradeScale: number; // 20 ou 100
  trimesters: number; // 3 ou 2 (semestres)
  termSystem: TermSystem; // "trimester" ou "semester"
  language: SchoolLanguage;
  currency: string;
  timezone: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  country: string;
  city: string;
  types: string; // Primaire, Secondaire, etc.
  academicYear: string;
  createdAt: string;
  status: SchoolStatus;
  settings: SchoolSettings;
  updatedAt?: string;
}

export interface CreateSchoolDTO {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  country: string;
  city: string;
  types: string;
  academicYear: string;
  settings: SchoolSettings;
}

export interface UpdateSchoolDTO extends Partial<CreateSchoolDTO> {
  status?: SchoolStatus;
}

export interface UserSchoolAssignment {
  userId: string;
  schoolId: string;
  role: string;
  assignedAt: string;
}
