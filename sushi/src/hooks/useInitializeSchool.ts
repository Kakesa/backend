/**
 * Hook pour initialiser l'école actuelle au chargement de l'application
 * Utilise les vraies données depuis l'API
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetCurrentSchool } from '@/services/api/schools.api';
import { setCurrentSchool, getCurrentSchool } from '@/data/schoolData';
import type { School } from '@/types/school.types';

export function useInitializeSchool() {
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSchool = async () => {
      try {
        // Si l'utilisateur n'a pas d'école, ne rien faire
        if (!user?.school) {
          console.log('ℹ️ Utilisateur sans école, pas d\'initialisation nécessaire');
          setIsInitializing(false);
          return;
        }

        // Vérifier si l'école est déjà initialisée
        const currentSchool = getCurrentSchool();
        if (currentSchool && currentSchool.id === user.school) {
          console.log('✅ École déjà initialisée:', currentSchool.name);
          setIsInitializing(false);
          return;
        }

        // Récupérer les données de l'école depuis l'API
        console.log('🔄 Initialisation de l\'école actuelle...');
        const schoolData = await apiGetCurrentSchool();
        
        if (schoolData) {
          setCurrentSchool(schoolData);
          console.log('✅ École initialisée avec succès:', schoolData.name);
        } else {
          console.warn('⚠️ Aucune donnée d\'école reçue de l\'API');
          setError('Impossible de charger les données de l\'école');
        }
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation de l\'école:', err);
        setError('Erreur lors du chargement de l\'école');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSchool();
  }, [user]);

  return {
    isInitializing,
    error,
    retry: () => {
      setError(null);
      setIsInitializing(true);
    }
  };
}
