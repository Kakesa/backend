import { api, setCurrentSchoolId } from "./client";
import type {
  School,
  CreateSchoolDTO,
  UpdateSchoolDTO,
  UserSchoolAssignment,
  TermSystem,
} from "@/types";

// ==========================================
// SCHOOLS API
// ==========================================

// GET /schools
export const apiGetAllSchools = async (): Promise<School[]> => {
  const response = await api.get<School[]>("/schools");
  return response.data.data || [];
};

// GET /schools/:id
export const apiGetSchoolById = async (
  id: string,
): Promise<School | undefined> => {
  const response = await api.get<School>(`/schools/${id}`);
  return response.data.data;
};

// GET /schools/current
export const apiGetCurrentSchool = async (): Promise<School | undefined> => {
  const response = await api.get<School>("/schools/current");
  return response.data.data;
};

// GET /schools/current/code
export const apiGetSchoolCode = async (): Promise<{ code: string }> => {
  const response = await api.get<{ code: string }>("/schools/current/code");
  const result = response.data;
  if (!result.data)
    throw new Error(result.message || "Failed to get school code");
  return result.data as { code: string };
};

// POST /schools/current/regenerate-code
export const apiRegenerateSchoolCode = async (): Promise<{ code: string }> => {
  const response = await api.post<{ code: string }>(
    "/schools/current/regenerate-code",
  );
  const result = response.data;
  if (!result.data)
    throw new Error(result.message || "Failed to regenerate code");
  return result.data as { code: string };
};

// POST /schools/current
export const apiSetCurrentSchool = async (schoolId: string): Promise<void> => {
  await api.post("/schools/current", { schoolId });
  setCurrentSchoolId(schoolId);
};

// POST /schools
export const apiCreateSchool = async (
  data: CreateSchoolDTO,
): Promise<School> => {
  const response = await api.post<School>("/schools", data);
  return response.data.data!;
};

// PUT /schools/:id
export const apiUpdateSchool = async (
  id: string,
  data: UpdateSchoolDTO,
): Promise<School | undefined> => {
  const response = await api.put<School>(`/schools/${id}`, data);
  return response.data.data;
};

// DELETE /schools/:id
export const apiDeleteSchool = async (id: string): Promise<boolean> => {
  await api.delete(`/schools/${id}`);
  return true;
};

// ==========================================
// USER SCHOOL ASSIGNMENTS
// ==========================================

// GET /schools/user/:userId
export const apiGetUserSchool = async (
  userId: string,
): Promise<string | undefined> => {
  const response = await api.get<{ schoolId: string }>(
    `/schools/user/${userId}`,
  );
  return response.data.data?.schoolId;
};

// POST /schools/assign
export const apiAssignUserToSchool = async (
  userId: string,
  schoolId: string,
  role: string,
): Promise<void> => {
  await api.post("/schools/assign", { userId, schoolId, role });
};

// GET /schools/:schoolId/users
export const apiGetSchoolUsers = async (
  schoolId: string,
): Promise<UserSchoolAssignment[]> => {
  const response = await api.get<UserSchoolAssignment[]>(
    `/schools/${schoolId}/users`,
  );
  return response.data.data || [];
};

// DELETE /schools/unassign/:userId
export const apiUnassignUserFromSchool = async (
  userId: string,
): Promise<boolean> => {
  await api.delete(`/schools/unassign/${userId}`);
  return true;
};

// PUT /schools/current/term-system
export const apiUpdateTermSystem = async (
  termSystem: TermSystem,
): Promise<{ termSystem: TermSystem; trimesters: number; message: string }> => {
  const response = await api.put<{
    termSystem: TermSystem;
    trimesters: number;
    message: string;
  }>("/schools/current/term-system", { termSystem });
  
  const result = response.data;
  if (!result.data)
    throw new Error(result.message || "Failed to update term system");
  return result.data;
};
