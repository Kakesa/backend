// ==========================================
// ABSENCE TYPES
// ==========================================

export type DocumentType = "medical" | "family" | "administrative" | "other";
export type JustificationStatus = "pending" | "approved" | "rejected";
export type AbsenceType = "full_day" | "partial" | "late";

export interface AbsenceJustification {
  id: string;
  absenceId: string;
  studentId: string;
  parentId: string;
  reason: string;
  documentType: DocumentType;
  fileName?: string;
  fileUrl?: string;
  submittedAt: string;
  status: JustificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AbsenceRecord {
  id: string;
  studentId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  courseId?: string;
  type: AbsenceType;
  justified: boolean;
  justificationId?: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJustificationDTO {
  absenceId: string;
  studentId: string;
  reason: string;
  documentType: DocumentType;
  fileName?: string;
  fileUrl?: string;
}

export interface ReviewJustificationDTO {
  status: "approved" | "rejected";
  reviewNotes?: string;
}
