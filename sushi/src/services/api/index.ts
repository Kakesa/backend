// ==========================================
// NOTE: notifications-school.api.ts est aussi disponible pour les notifications d'inscription
// SERVICE API - Point d'entrée principal
// ==========================================
// Ce fichier exporte tous les modules API

// Client API centralisé
export { default as apiClient, api, API_BASE_URL } from "./client";
export {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setCurrentSchoolId,
  getCurrentSchoolId,
  uploadFile,
  uploadMultipleFiles,
} from "./client";

// Modules API
export * from "./auth.api";
export * from "./students.api";
export * from "./teachers.api";
export * from "./classes.api";
export * from "./subjects.api";
export * from "./courses.api";
export * from "./grades.api";
export * from "./attendance.api";
export * from "./assignments.api";
export * from "./calendar.api";
export * from "./notifications.api";
export * from "./absences.api";
export * from "./competences.api";
export * from "./messages.api";
export * from "./schedule.api";
export * from "./schools.api";
export * from "./permissions.api";
