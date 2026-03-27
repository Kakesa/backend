/* eslint-disable @typescript-eslint/no-empty-object-type */
// ==========================================
// COMPETENCE TYPES
// ==========================================

export type ObjectiveLevel = "beginner" | "intermediate" | "advanced";
export type AcquisitionLevel = "non_acquis" | "en_cours" | "acquis" | "expert";

export interface CompetenceObjective {
  id: string;
  name: string;
  description: string;
  level: ObjectiveLevel;
}

export interface Competence {
  id: string;
  name: string;
  description: string;
  subjectId: string;
  category: string;
  objectives: CompetenceObjective[];
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentCompetenceEvaluation {
  id: string;
  studentId: string;
  competenceId: string;
  objectiveId: string;
  trimester: 1 | 2 | 3;
  level: AcquisitionLevel;
  evaluatedAt: string;
  evaluatedBy: string;
  notes?: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompetenceDTO {
  name: string;
  description: string;
  subjectId: string;
  category: string;
  objectives: Omit<CompetenceObjective, "id">[];
}

export interface UpdateCompetenceDTO extends Partial<CreateCompetenceDTO> {}

export interface CreateEvaluationDTO {
  studentId: string;
  competenceId: string;
  objectiveId: string;
  trimester: 1 | 2 | 3;
  level: AcquisitionLevel;
  notes?: string;
}

export interface UpdateEvaluationDTO {
  level: AcquisitionLevel;
  notes?: string;
}

export interface CompetenceProgress {
  total: number;
  acquired: number;
  inProgress: number;
  notAcquired: number;
  percentage: number;
}
