/* eslint-disable @typescript-eslint/no-explicit-any */
export interface StudentPaymentStatus {
  isPaid: boolean;
  status: string;
  unpaidCount: number;
}

export interface Student {
  [x: string]: string;
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  enrollmentDate: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  paymentStatus?: string | StudentPaymentStatus;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Populated fields
  class?: { _id: string; name: string; studentCount?: number } | string;
  school?: { _id: string; name: string } | string;
  parent?: any;
}

export interface CreateStudentDTO {
  matricule?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentRelation?: string;
  enrollmentDate: string;
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}
