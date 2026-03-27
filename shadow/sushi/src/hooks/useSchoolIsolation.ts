/**
 * Hook pour l'isolation multi-tenant
 * Fournit des utilitaires pour filtrer et valider les données par école
 */

import { useMemo } from 'react';
import { getCurrentSchool, getCurrentSchoolId } from '@/data/schoolData';
import { belongsToCurrentSchool, filterByCurrentSchool } from '@/lib/apiHelper';

export function useSchoolIsolation() {
  const currentSchool = getCurrentSchool();
  const currentSchoolId = getCurrentSchoolId();

  // Vérifie si l'utilisateur a une école
  const hasSchool = useMemo(() => {
    return !!currentSchool && !!currentSchoolId;
  }, [currentSchool, currentSchoolId]);

  // Vérifie si une entité appartient à l'école actuelle
  const isEntityFromCurrentSchool = useMemo(() => {
    return (entity: any) => belongsToCurrentSchool(entity);
  }, []);

  // Filtre une liste d'entités par école actuelle
  const filterEntitiesBySchool = useMemo(() => {
    return <T extends { schoolId?: string; school?: string }>(
      entities: T[]
    ): T[] => filterByCurrentSchool(entities);
  }, []);

  // Vérifie si l'utilisateur peut accéder aux données de l'école
  const canAccessSchoolData = useMemo(() => {
    return hasSchool;
  }, [hasSchool]);

  // Retourne les informations de l'école actuelle
  const schoolInfo = useMemo(() => {
    if (!currentSchool) return null;
    
    return {
      id: currentSchool.id,
      name: currentSchool.name,
      code: currentSchool.code,
      settings: currentSchool.settings,
      termSystem: currentSchool.settings?.termSystem || 'trimester',
      trimesters: currentSchool.settings?.trimesters || 3,
      gradeScale: currentSchool.settings?.gradeScale || 20,
    };
  }, [currentSchool]);

  return {
    // État
    currentSchool,
    currentSchoolId,
    hasSchool,
    schoolInfo,
    
    // Utilitaires
    isEntityFromCurrentSchool,
    filterEntitiesBySchool,
    canAccessSchoolData,
    
    // Validation
    validateEntityAccess: (entity: any) => {
      if (!canAccessSchoolData) {
        throw new Error('Aucune école sélectionnée');
      }
      if (!isEntityFromCurrentSchool(entity)) {
        throw new Error('Accès non autorisé à cette ressource');
      }
      return true;
    }
  };
}
