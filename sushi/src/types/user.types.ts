/* eslint-disable @typescript-eslint/no-empty-object-type */
// ==========================================
// USER TYPES
// ==========================================

export type UserRole =
  | "superadmin"
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "accountant";

export interface User {
  id: string;
  email: string;
  password?: string; // Ne jamais exposer côté client
  role: UserRole;
  linkedId?: string; // ID du professeur, élève ou parent associé
  linkedProfile?: any; // Profil lié (Teacher, Student, Parent, etc.)
  firstName?: string;
  lastName?: string;
  name?: string; // Ajouté pour compatibilité avec certains retours API
  avatarUrl?: string;
  schoolId?: string;
  school?: unknown; // Ajouté pour compatibilité avec Login.tsx
  status?: "active" | "inactive";
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  mustChangePassword?: boolean;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  role: UserRole;
  linkedId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
}

export interface UpdateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: "active" | "inactive";
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO extends CreateUserDTO {}
