/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// ASSIGNMENT TYPES
// ==========================================

export type AssignmentType = "devoir" | "tp" | "projet" | "exposé";
export type AssignmentStatus = "published" | "draft" | "closed";
export type SubmissionStatus = "submitted" | "graded" | "late";
export type QuestionType = "qcm" | "short_answer" | "long_answer";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  exercise?: string; // Grouping label like "Exercice 1 : Les Temps Verbaux"
  options?: QuestionOption[]; // For QCM
  correctAnswer?: string; // For short_answer verification
}

export interface RubricItem {
  id: string;
  criteria: string;
  description: string;
  maxPoints: number;
}

export interface Assignment {
  id: string;
  _id?: string;
  title: string;
  description: string;
  type: AssignmentType;
  classId: string | { _id: string; name: string };
  courseId: string | { _id: string; name: string; code: string };
  teacherId: string | { _id: string; firstName: string; lastName: string };
  dueDate: string;
  maxPoints: number;
  attachments?: string[];
  questions?: Question[];
  rubric?: RubricItem[];
  isWorksheet?: boolean;
  trimester?: number;
  academicYear?: string;
  status: AssignmentStatus;
  submissions?: AssignmentSubmission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentSubmission {
  id: string;
  _id?: string;
  assignmentId: string | Assignment;
  studentId:
  | string
  | {
    _id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    photo?: string;
  };
  content: string;
  submissionType: "file" | "link";
  attachments?: string[];
  linkUrl?: string;
  answers?: { questionId: string; value: string }[];
  selfReview?: { rubricId: string; score: number; comment?: string }[];
  grade?: number;
  feedback?: string;
  status: SubmissionStatus;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssignmentDTO {
  title: string;
  description: string;
  type: AssignmentType;
  classId: string;
  courseId: string;
  dueDate: string;
  maxPoints: number;
  attachments?: string[];
  questions?: Question[];
  rubric?: RubricItem[];
  isWorksheet?: boolean;
  trimester?: number;
  academicYear?: string;
  status?: AssignmentStatus;
}

export type UpdateAssignmentDTO = Partial<CreateAssignmentDTO>;

export interface SubmitAssignmentDTO {
  content?: string;
  submissionType: "file" | "link";
  attachments?: string[];
  linkUrl?: string;
  answers?: { questionId: string; value: string }[];
  selfReview?: { rubricId: string; score: number; comment?: string }[];
}

export interface GradeSubmissionDTO {
  grade: number;
  feedback: string;
}

export interface AssignmentFilterParams {
  teacherId?: string;
  classId?: string;
  studentId?: string;
  type?: string;
  [key: string]: any;
}
