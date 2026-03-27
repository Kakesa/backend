/* eslint-disable @typescript-eslint/no-explicit-any */
// Multi-tenancy: Gestion des écoles et isolation des données

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
  status: "active" | "inactive";
  settings: SchoolSettings;
}

export interface SchoolSettings {
  gradeScale: number; // 20 ou 100
  trimesters: number; // 3 ou 2 (semestres)
  termSystem: "trimester" | "semester"; // "trimester" ou "semester"
  language: "fr" | "en";
  currency: string;
  timezone: string;
}

// Contexte de l'école active (simulé - en production, viendrait du JWT/session)
let currentSchoolId: string | null = null;
let currentSchool: School | null = null;

export const setCurrentSchool = (school: School): void => {
  currentSchool = school;
  currentSchoolId = school.id;
};

export const getCurrentSchool = (): School | null => {
  return currentSchool;
};

export const getCurrentSchoolId = (): string | null => {
  return currentSchoolId;
};

export const clearCurrentSchool = (): void => {
  currentSchool = null;
  currentSchoolId = null;
};
