// ==========================================
// GRADE TYPES
// ==========================================

export interface Grade {
  id: string;
  studentId:
  | string
  | {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  subjectId:
  | string
  | {
    _id?: string;
    id?: string;
    name: string;
    code: string;
    coefficient: number;
  };
  trimester: 1 | 2 | 3;
  interrogation1: number | null;
  interrogation2: number | null;
  devoir: number | null;
  examen: number | null;
  moyenne: number | null;
  appreciation: string;
  academicYear: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrimestreData {
  maxPeriode: number;
  periode1: number | null;
  periode2: number | null;
  maxExam: number;
  ptsObtenuExamen: number | null;
  maxTrim: number;
  ptsObtenuTrimestre: number | null;
}

export interface BulletinAnnuel {
  trimestre1: TrimestreData;
  trimestre2: TrimestreData;
  trimestre3: TrimestreData;
  totalAnnuel: {
    ptsTotal: number;
    obtention: string;
  };
}

export interface CreateGradeDTO {
  studentId: string;
  subjectId: string;
  trimester: 1 | 2 | 3;
  interrogation1?: number;
  interrogation2?: number;
  devoir?: number;
  examen?: number;
  appreciation?: string;
  academicYear: string;
}

export interface UpdateGradeDTO extends Partial<CreateGradeDTO> {
  moyenne?: number;
}

export interface BulkGradeDTO {
  grades: CreateGradeDTO[];
}

export interface GradeFilterParams {
  classId?: string;
  subjectId?: string;
  trimester?: string | number;
  academicYear?: string;
  studentId?: string;
  limit?: string | number;
  [key: string]: string | number | boolean | undefined;
}

export interface StudentRank {
  studentId: string;
  firstName: string;
  lastName: string;
  matricule: string;
  class: string;
  classId: string;
  moyenne: number;
  totalCoef: number;
  count: number;
  rank: number;
}

export interface SchoolAverage {
  trimester: number;
  average: number;
}
