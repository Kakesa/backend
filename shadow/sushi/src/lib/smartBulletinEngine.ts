import { getCurrentSchool } from '@/data/schoolData';
import { generatePortraitDRCBulletin } from '@/lib/bulletinPortraitDRC';
import { generateBulletinGenericPDF } from '@/lib/bulletinEngine';
import type { BulletinData } from '@/types';

/**
 * Moteur de bulletin intelligent qui choisit automatiquement
 * le bon système selon la configuration de l'école
 */
export class SmartBulletinEngine {
  /**
   * Génère un bulletin en utilisant le moteur approprié
   * selon le système de termes configuré pour l'école
   */
  static async generateBulletin(data: BulletinData): Promise<void> {
    // Récupérer l'école actuelle pour le système de termes
    const school = getCurrentSchool();
    
    if (!school) {
      throw new Error('Aucune école configurée pour générer le bulletin');
    }

    // Vérifier que l'élève appartient à l'école actuelle
    if (data.student.schoolId && data.student.schoolId !== school.id) {
      throw new Error('L\'élève n\'appartient pas à l\'établissement actuel');
    }

    const termSystem = school.settings?.termSystem || 'trimester';
    
    console.log(`🎓 Génération bulletin pour ${school.name} (système: ${termSystem})`);
    
    if (termSystem === 'trimester') {
      // Système à 3 trimestres : utiliser bulletinPortraitDRC
      console.log('📋 Utilisation du moteur bulletinPortraitDRC (trimestres)');
      return await generatePortraitDRCBulletin({
        student: data.student,
        grades: data.grades,
        subjects: data.subjects || [],
        academicYear: data.academicYear,
        schoolName: school.name,
        schoolAddress: school.address,
        schoolCode: school.code,
        nPerm: data.student.matricule || "N/A",
        province: school.city || "Kinshasa",
        schoolLogo: school.logo,
        layoutType: 'trimester',
      });
    } else {
      // Système à 2 semestres : utiliser bulletinEngine
      console.log('📋 Utilisation du moteur bulletinEngine (semestres)');
      return await generateBulletinGenericPDF({
        student: data.student,
        grades: data.grades,
        academicYear: data.academicYear,
        schoolName: school.name,
        schoolAddress: school.address,
        schoolCode: school.code,
      });
    }
  }

  /**
   * Retourne le type de système de termes actuel
   */
  static getCurrentTermSystem(): 'trimester' | 'semester' {
    const school = getCurrentSchool();
    return school?.settings?.termSystem || 'trimester';
  }

  /**
   * Retourne le nombre de périodes selon le système
   */
  static getPeriodCount(): number {
    const termSystem = this.getCurrentTermSystem();
    return termSystem === 'trimester' ? 3 : 2;
  }

  /**
   * Vérifie si une génération de bulletin est autorisée
   * pour l'élève et l'école actuelle
   */
  static canGenerateBulletin(studentId: string, schoolId: string): boolean {
    const school = getCurrentSchool();
    
    if (!school) {
      console.error('❌ Aucune école configurée');
      return false;
    }

    if (school.id !== schoolId) {
      console.error('❌ Tentative d\'accès à une autre école', { 
        requestedSchool: schoolId, 
        currentSchool: school.id 
      });
      return false;
    }

    console.log('✅ Génération de bulletin autorisée pour', { 
      studentId, 
      schoolName: school.name 
    });
    
    return true;
  }
}

export default SmartBulletinEngine;
