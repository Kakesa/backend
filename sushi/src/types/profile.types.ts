export interface ProfilePhoto {
  photo: string;
  photoUrl: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: ProfilePhoto;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  role: string;
}

export interface StudentProfile extends UserProfile {
  matricule: string;
  dateOfBirth: Date;
  gender: string;
  class?: string;
}

export interface TeacherProfile extends UserProfile {
  matricule: string;
  hireDate: Date;
  subjects: string[];
  classes: string[];
}

export interface ParentProfile extends UserProfile {
  profession?: string;
  childrenIds?: string[];
}
