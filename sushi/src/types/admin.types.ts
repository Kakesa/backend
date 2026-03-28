// ==========================================
// ADMIN TYPES - School Administrators
// ==========================================

export interface SchoolAdmin {
  id: string;
  userId: string;
  schoolId: string;
  schoolName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin?: string;
  avatarUrl?: string;
}

export interface CreateAdminDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  schoolId: string;
  password: string;
}

export interface UpdateAdminDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive" | "suspended";
}
