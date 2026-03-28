// ==========================================
// ABSENCES API
// ==========================================

import { api, uploadFile } from "./client";
import type {
  AbsenceJustification,
  AbsenceRecord,
  CreateJustificationDTO,
  ReviewJustificationDTO,
  FilterParams,
} from "@/types";

// GET /absences
export const apiGetAllAbsences = async (
  params?: FilterParams,
): Promise<AbsenceRecord[]> => {
  const response = await api.get<AbsenceRecord[]>("/absences", { params });
  return response.data.data || [];
};

// GET /absences/student/:studentId
export const apiGetAbsencesByStudent = async (
  studentId: string,
): Promise<AbsenceRecord[]> => {
  const response = await api.get<AbsenceRecord[]>(
    `/absences/student/${studentId}`,
  );
  return response.data.data || [];
};

// GET /absences/justifications
export const apiGetAllJustifications = async (
  params?: FilterParams,
): Promise<AbsenceJustification[]> => {
  const response = await api.get<AbsenceJustification[]>(
    "/absences/justifications",
    {
      params,
    },
  );
  return response.data.data || [];
};

// GET /absences/justifications/student/:studentId
export const apiGetJustificationsByStudent = async (
  studentId: string,
): Promise<AbsenceJustification[]> => {
  const response = await api.get<AbsenceJustification[]>(
    `/absences/justifications/student/${studentId}`,
  );
  return response.data.data || [];
};

// GET /absences/justifications/pending
export const apiGetPendingJustifications = async (): Promise<
  AbsenceJustification[]
> => {
  const response = await api.get<AbsenceJustification[]>(
    "/absences/justifications/pending",
  );
  return response.data.data || [];
};

// GET /absences/teacher/my-classes
export const apiGetTeacherAbsences = async (
  params?: FilterParams,
): Promise<AbsenceRecord[]> => {
  try {
    console.log("Attempting teacher absences route...");
    const response = await api.get<AbsenceRecord[]>("/absences/teacher/my-classes", { params });
    console.log("Teacher absences success:", response.data);
    return response.data.data || [];
  } catch (error: any) {
    console.warn("Teacher route failed, trying admin route:", error);
    
    // Check if it's an HTML response (backend page)
    if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
      console.error("Backend is returning HTML instead of JSON. Backend may not be running or routes not configured.");
      return []; // Return empty array to prevent crashes
    }
    
    try {
      console.log("Attempting admin absences route...");
      const response = await api.get<AbsenceRecord[]>("/absences", { params });
      console.log("Admin absences success:", response.data);
      return response.data.data || [];
    } catch (adminError: any) {
      console.error("Admin route also failed:", adminError);
      
      // Check if it's an HTML response
      if (adminError.response && typeof adminError.response.data === 'string' && adminError.response.data.includes('<!doctype')) {
        console.error("Backend is returning HTML instead of JSON. Backend may not be running or routes not configured.");
        return []; // Return empty array to prevent crashes
      }
      
      return [];
    }
  }
};

// GET /absences/teacher/justifications/pending
export const apiGetPendingTeacherJustifications = async (): Promise<
  AbsenceJustification[]
> => {
  try {
    console.log("Attempting teacher justifications route...");
    const response = await api.get<AbsenceJustification[]>(
      "/absences/teacher/justifications/pending",
    );
    console.log("Teacher justifications success:", response.data);
    return response.data.data || [];
  } catch (error: any) {
    console.warn("Teacher justification route failed, trying admin route:", error);
    
    // Check if it's an HTML response (backend page)
    if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
      console.error("Backend is returning HTML instead of JSON. Backend may not be running or routes not configured.");
      return []; // Return empty array to prevent crashes
    }
    
    try {
      console.log("Attempting admin justifications route...");
      const response = await api.get<AbsenceJustification[]>(
        "/absences/justifications/pending",
      );
      console.log("Admin justifications success:", response.data);
      return response.data.data || [];
    } catch (adminError: any) {
      console.error("Admin justification route also failed:", adminError);
      
      // Check if it's an HTML response
      if (adminError.response && typeof adminError.response.data === 'string' && adminError.response.data.includes('<!doctype')) {
        console.error("Backend is returning HTML instead of JSON. Backend may not be running or routes not configured.");
        return []; // Return empty array to prevent crashes
      }
      
      return [];
    }
  }
};

// POST /absences/justifications
export const apiCreateJustification = async (
  data: CreateJustificationDTO & { parentId: string },
): Promise<AbsenceJustification> => {
  const response = await api.post<AbsenceJustification>(
    "/absences/justifications",
    data,
  );
  return response.data.data!;
};

// PUT /absences/justifications/:id/review
export const apiReviewJustification = async (
  id: string,
  reviewedBy: string,
  data: ReviewJustificationDTO,
): Promise<AbsenceJustification | undefined> => {
  const response = await api.put<AbsenceJustification>(
    `/absences/justifications/${id}/review`,
    {
      ...data,
      reviewedBy,
    },
  );
  return response.data.data;
};

// POST /absences/justifications/:id/upload
export const apiUploadJustificationFile = async (
  justificationId: string,
  file: File,
): Promise<string> => {
  const response = await uploadFile(
    `/absences/justifications/${justificationId}/upload`,
    file,
  );
  return response.data.data?.url || "";
};

// POST /absences
export const apiCreateAbsence = async (
  data: Omit<AbsenceRecord, "id">,
): Promise<AbsenceRecord> => {
  const response = await api.post<AbsenceRecord>("/absences", data);
  return response.data.data!;
};

// PUT /absences/:id
export const apiUpdateAbsence = async (
  id: string,
  data: Partial<AbsenceRecord>,
): Promise<AbsenceRecord | undefined> => {
  const response = await api.put<AbsenceRecord>(`/absences/${id}`, data);
  return response.data.data;
};
