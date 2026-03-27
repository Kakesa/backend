// ==========================================
// ASSIGNMENTS API
// ==========================================

import { api, uploadFile } from "./client";
import type {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
  SubmitAssignmentDTO,
  GradeSubmissionDTO,
  AssignmentFilterParams,
} from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const normalizeAssignment = (data: any): Assignment => {
  const normalized = {
    ...data,
    id: data.id || data._id,
    classId:
      data.classId && typeof data.classId === "object"
        ? { ...data.classId, id: data.classId._id || data.classId.id }
        : data.classId,
    courseId:
      data.courseId && typeof data.courseId === "object"
        ? { ...data.courseId, id: data.courseId._id || data.courseId.id }
        : data.courseId,
    teacherId:
      data.teacherId && typeof data.teacherId === "object"
        ? { ...data.teacherId, id: data.teacherId._id || data.teacherId.id }
        : data.teacherId,
  };

  if (normalized.questions && Array.isArray(normalized.questions)) {
    normalized.questions = normalized.questions.map((q: any) => ({
      ...q,
      id: q.id || q._id,
      options:
        q.options && Array.isArray(q.options)
          ? q.options.map((opt: any) => ({ ...opt, id: opt.id || opt._id }))
          : q.options,
    }));
  }

  return normalized;
};

const normalizeSubmission = (data: any): AssignmentSubmission => ({
  ...data,
  id: data.id || data._id,
  // If assignmentId is populated, normalize it too?
  // For now, just id.
});

// GET /assignments/:id
export const apiGetAssignmentById = async (
  id: string,
): Promise<Assignment> => {
  const response = await api.get<any>(`/assignments/${id}`);
  return normalizeAssignment(response.data.data);
};

// GET /assignments
export const apiGetAllAssignments = async (
  params?: AssignmentFilterParams,
): Promise<Assignment[]> => {
  const response = await api.get<any[]>("/assignments", { params });
  return (response.data.data || []).map(normalizeAssignment);
};

// GET /assignments (filtered by teacher)
export const apiGetAssignmentsByTeacher = async (
  teacherId: string,
): Promise<Assignment[]> => {
  return apiGetAllAssignments({ teacherId });
};

// GET /assignments (filtered by class)
export const apiGetAssignmentsByClass = async (
  classId: string,
): Promise<Assignment[]> => {
  return apiGetAllAssignments({ classId });
};

// GET /assignments/student/:studentId
export const apiGetAssignmentsByStudent = async (
  studentId: string,
  classId?: string,
): Promise<Assignment[]> => {
  const response = await api.get<any[]>(`/assignments/student/${studentId}`, {
    params: { classId },
  });
  return (response.data.data || []).map(normalizeAssignment);
};

// GET /assignments/:id/submission/:studentId
export const apiGetStudentSubmission = async (
  assignmentId: string,
  studentId: string,
): Promise<AssignmentSubmission | undefined> => {
  const response = await api.get<any>(
    `/assignments/${assignmentId}/submission/${studentId}`,
  );
  return response.data.data
    ? normalizeSubmission(response.data.data)
    : undefined;
};

// POST /assignments
export const apiCreateAssignment = async (
  data: CreateAssignmentDTO & { teacherId: string },
): Promise<Assignment> => {
  const response = await api.post<any>("/assignments", data);
  return normalizeAssignment(response.data.data);
};

// PUT /assignments/:id
export const apiUpdateAssignment = async (
  id: string,
  data: UpdateAssignmentDTO,
): Promise<Assignment | undefined> => {
  const response = await api.put<any>(`/assignments/${id}`, data);
  return response.data.data
    ? normalizeAssignment(response.data.data)
    : undefined;
};

// DELETE /assignments/:id
export const apiDeleteAssignment = async (id: string): Promise<boolean> => {
  await api.delete(`/assignments/${id}`);
  return true;
};

// POST /assignments/:id/submit
export const apiSubmitAssignment = async (
  assignmentId: string,
  studentId: string,
  data: SubmitAssignmentDTO,
): Promise<AssignmentSubmission> => {
  const response = await api.post<any>(`/assignments/${assignmentId}/submit`, {
    studentId,
    ...data,
  });
  return normalizeSubmission(response.data.data);
};

// POST /assignments/:id/grade/:studentId
export const apiGradeSubmission = async (
  assignmentId: string,
  studentId: string,
  data: GradeSubmissionDTO,
): Promise<AssignmentSubmission | undefined> => {
  const response = await api.post<any>(
    `/assignments/${assignmentId}/grade/${studentId}`,
    data,
  );
  return response.data.data
    ? normalizeSubmission(response.data.data)
    : undefined;
};

// GET /assignments/pending/:teacherId
export const apiGetPendingSubmissions = async (
  teacherId: string,
): Promise<{ assignment: Assignment; submission: AssignmentSubmission }[]> => {
  // Backend returns Submission[] populated with assignmentId as Assignment object
  const response = await api.get<any[]>(`/assignments/pending/${teacherId}`);
  const submissions = response.data.data || [];

  return submissions.map((sub: any) => {
    // assignmentId here is likely the populated object
    const assignment =
      typeof sub.assignmentId === "object"
        ? normalizeAssignment(sub.assignmentId)
        : ({ id: sub.assignmentId } as Assignment);

    return {
      assignment,
      submission: normalizeSubmission(sub),
    };
  });
};

// POST /assignments/:id/upload
export const apiUploadAssignmentFile = async (
  assignmentId: string,
  file: File,
): Promise<string> => {
  const response = await uploadFile(
    `/assignments/${assignmentId}/upload`,
    file,
  );
  return response.data.data?.url || "";
};
