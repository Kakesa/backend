/* eslint-disable @typescript-eslint/no-empty-object-type */
// ==========================================
// SUBJECT TYPES
// ==========================================

export interface Subject {
  id: string;
  name: string;
  code: string;
  coefficient: number;
  category: "scientifique" | "litteraire" | "artistique" | "sportif";
  domaine?: string; // Domaine explicite pour le regroupement dans le bulletin (ex: "DOMAINE DES SCIENCES")
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubjectDTO {
  name: string;
  code: string;
  coefficient: number;
  category: "scientifique" | "litteraire" | "artistique" | "sportif";
  domaine?: string;
  schoolId?: string;
}

export interface UpdateSubjectDTO extends Partial<CreateSubjectDTO> {}
