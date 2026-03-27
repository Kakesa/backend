/**
 * Helper pour l'isolation multi-tenant
 * Injecte automatiquement le schoolId dans toutes les requêtes API
 */

import { getCurrentSchoolId } from '@/data/schoolData';

/**
 * Ajoute le schoolId aux paramètres de requête
 */
export const addSchoolIdToParams = (params: any = {}): any => {
  const schoolId = getCurrentSchoolId();
  if (schoolId && !params.schoolId) {
    return { ...params, schoolId };
  }
  return params;
};

/**
 * Ajoute le schoolId aux données du body
 */
export const addSchoolIdToBody = (data: any): any => {
  const schoolId = getCurrentSchoolId();
  if (schoolId && !data.schoolId) {
    return { ...data, schoolId };
  }
  return data;
};

/**
 * Vérifie si une entité appartient à l'école actuelle
 */
export const belongsToCurrentSchool = (entity: any): boolean => {
  const schoolId = getCurrentSchoolId();
  if (!schoolId || !entity) return false;
  
  const entitySchoolId = entity.schoolId || entity.school;
  return entitySchoolId === schoolId;
};

/**
 * Filtre une liste d'entités par école actuelle
 */
export const filterByCurrentSchool = <T extends { schoolId?: string; school?: string }>(
  entities: T[]
): T[] => {
  const schoolId = getCurrentSchoolId();
  if (!schoolId) return entities;
  
  return entities.filter(entity => {
    const entitySchoolId = entity.schoolId || entity.school;
    return entitySchoolId === schoolId;
  });
};

/**
 * Wrapper pour les appels API avec schoolId automatique
 */
export const withSchoolIsolation = <T extends any[], R = T>(
  apiCall: (...args: any[]) => Promise<R>
) => {
  return (...args: any[]): Promise<R> => {
    // Ajouter schoolId au premier argument (params) si c'est un objet
    if (args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      args[0] = addSchoolIdToParams(args[0]);
    }
    
    // Ajouter schoolId au deuxième argument (data) si c'est un objet
    if (args[1] && typeof args[1] === 'object' && !Array.isArray(args[1])) {
      args[1] = addSchoolIdToBody(args[1]);
    }
    
    return apiCall(...args);
  };
};
