// ==========================================
// COMPETENCES API
// ==========================================

import { api } from "./client";
import type {
  Competence,
  StudentCompetenceEvaluation,
  CreateCompetenceDTO,
  UpdateCompetenceDTO,
  CreateEvaluationDTO,
  UpdateEvaluationDTO,
  CompetenceProgress,
  FilterParams,
} from "@/types";

// GET /competences
export const apiGetAllCompetences = async (
  params?: FilterParams,
): Promise<Competence[]> => {
  const response = await api.get<Competence[]>("/competences", { params });
  return response.data.data || [];
};

// GET /competences/subject/:subjectId
export const apiGetCompetencesBySubject = async (
  subjectId: string,
): Promise<Competence[]> => {
  return apiGetAllCompetences({ subjectId });
};

// GET /competences/:id
export const apiGetCompetenceById = async (
  id: string,
): Promise<Competence | undefined> => {
  const response = await api.get<Competence>(`/competences/${id}`);
  return response.data.data;
};

// POST /competences
export const apiCreateCompetence = async (
  data: CreateCompetenceDTO,
): Promise<Competence> => {
  const response = await api.post<Competence>("/competences", data);
  return response.data.data!;
};

// PUT /competences/:id
export const apiUpdateCompetence = async (
  id: string,
  data: UpdateCompetenceDTO,
): Promise<Competence | undefined> => {
  const response = await api.put<Competence>(`/competences/${id}`, data);
  return response.data.data;
};

// DELETE /competences/:id
export const apiDeleteCompetence = async (id: string): Promise<boolean> => {
  await api.delete(`/competences/${id}`);
  return true;
};

// GET /evaluations/student/:studentId
export const apiGetStudentEvaluations = async (
  studentId: string,
  trimester?: number,
): Promise<StudentCompetenceEvaluation[]> => {
  const response = await api.get<StudentCompetenceEvaluation[]>(
    `/evaluations/student/${studentId}`,
    { params: trimester ? { trimester } : {} },
  );
  return response.data.data || [];
};

// GET /evaluations/progress/:studentId/:competenceId
export const apiGetCompetenceProgress = async (
  studentId: string,
  competenceId: string,
): Promise<CompetenceProgress> => {
  const response = await api.get<CompetenceProgress>(
    `/evaluations/progress/${studentId}/${competenceId}`,
  );
  return response.data.data!;
};

// POST /evaluations
export const apiCreateEvaluation = async (
  data: CreateEvaluationDTO & { evaluatedBy: string },
): Promise<StudentCompetenceEvaluation> => {
  const response = await api.post<StudentCompetenceEvaluation>(
    "/evaluations",
    data,
  );
  return response.data.data!;
};

// PUT /evaluations/:id
export const apiUpdateEvaluation = async (
  id: string,
  data: UpdateEvaluationDTO,
): Promise<StudentCompetenceEvaluation | undefined> => {
  const response = await api.put<StudentCompetenceEvaluation>(
    `/evaluations/${id}`,
    data,
  );
  return response.data.data;
};

// DELETE /evaluations/:id
export const apiDeleteEvaluation = async (id: string): Promise<boolean> => {
  await api.delete(`/evaluations/${id}`);
  return true;
};
