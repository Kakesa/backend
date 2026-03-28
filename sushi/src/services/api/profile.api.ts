import axios from 'axios';
import { api } from './client';
import type { UploadResponse } from '@/types/profile.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Créer une instance Axios dédiée pour les uploads
const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Intercepteur pour l'upload API
uploadApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const schoolId = localStorage.getItem("currentSchoolId");
    if (schoolId) {
      config.headers["X-School-Id"] = schoolId;
    }

    // NE PAS transformer FormData
    return config;
  },
  (error) => Promise.reject(error)
);

// Obtenir l'URL de la photo de profil
export const getProfilePhotoUrl = (userType: string, userId: string): string => {
  return `${API_BASE_URL}/uploads/profile/${userType}/${userId}/photo`;
};

// Mettre à jour la photo de profil
export const updateProfilePhoto = async (
  userType: string, 
  userId: string, 
  file: File
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('photo', file);

  try {
    // Utiliser l'instance uploadApi pour éviter les transformations
    const response = await uploadApi.post(
      `/uploads/profile/${userType}/${userId}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data as UploadResponse;
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Erreur lors du téléchargement de la photo'
    );
  }
};

// Supprimer la photo de profil
export const deleteProfilePhoto = async (
  userType: string, 
  userId: string
): Promise<UploadResponse> => {
  try {
    const response = await uploadApi.delete(
      `/uploads/profile/${userType}/${userId}/photo`
    );

    return response.data as UploadResponse;
  } catch (error: any) {
    console.error('Error deleting profile photo:', error);
    throw new Error(
      error.response?.data?.message || 'Erreur lors de la suppression de la photo'
    );
  }
};

// Obtenir la photo par défaut
export const getDefaultPhotoUrl = (): string => {
  return `${API_BASE_URL}/uploads/profile/default-avatar.svg`;
};
