/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// API TYPES - Types génériques pour les réponses API
// ==========================================

// Réponse API standard
export interface ApiResponse<T> {
  [x: string]: any;
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Réponse API paginée
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Paramètres de pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Paramètres de filtrage
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | number | boolean | undefined;
}

import { UserRole } from "./user.types";

// Réponse d'authentification
export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    name?: string;
  };
  message?: string;
}

// Erreur API
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
