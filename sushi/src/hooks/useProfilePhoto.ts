import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfilePhoto, deleteProfilePhoto } from '@/services/api/profile.api';

interface UseProfilePhotoOptions {
  userType: 'user' | 'student' | 'teacher' | 'parent';
  userId: string;
  currentPhoto?: string;
}

interface UseProfilePhotoReturn {
  isUploading: boolean;
  isDeleting: boolean;
  error: string | null;
  uploadPhoto: (file: File) => Promise<void>;
  removePhoto: () => Promise<void>;
  clearError: () => void;
}

export const useProfilePhoto = ({
  userType,
  userId,
  currentPhoto
}: UseProfilePhotoOptions): UseProfilePhotoReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await updateProfilePhoto(userType, userId, file);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      // Mettre à jour le contexte utilisateur avec la nouvelle photo
      const { refreshUser } = useAuth();
      if (response.data?.photoUrl) {
        // Mettre à jour le user dans localStorage et rafraîchir
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.avatarUrl = response.data.photoUrl;
        localStorage.setItem('user', JSON.stringify(currentUser));
        await refreshUser();
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [userType, userId]);

  const removePhoto = useCallback(async () => {
    if (!currentPhoto) {
      setError('Aucune photo à supprimer');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteProfilePhoto(userType, userId);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      // Mettre à jour le contexte utilisateur pour supprimer l'avatar
      const { refreshUser } = useAuth();
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.avatarUrl = '';
      localStorage.setItem('user', JSON.stringify(currentUser));
      await refreshUser();
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [userType, userId, currentPhoto]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isUploading,
    isDeleting,
    error,
    uploadPhoto,
    removePhoto,
    clearError
  };
};
