import { getCurrentSchool } from '@/data/schoolData';
import type { TermSystem } from '@/types/school.types';

export class TermSystemManager {
  private static instance: TermSystemManager;
  private currentTermSystem: TermSystem | null = null;

  private constructor() {}

  public static getInstance(): TermSystemManager {
    if (!TermSystemManager.instance) {
      TermSystemManager.instance = new TermSystemManager();
    }
    return TermSystemManager.instance;
  }

  /**
   * Obtenir le système de termes actuel
   */
  public getCurrentTermSystem(): TermSystem {
    if (this.currentTermSystem) {
      return this.currentTermSystem;
    }

    const school = getCurrentSchool();
    this.currentTermSystem = school?.settings?.termSystem || 'trimester';
    return this.currentTermSystem;
  }

  /**
   * Définir le système de termes
   */
  public setTermSystem(termSystem: TermSystem): void {
    this.currentTermSystem = termSystem;
  }

  /**
   * Vérifier si le système actuel est par trimestres
   */
  public isTrimesterSystem(): boolean {
    return this.getCurrentTermSystem() === 'trimester';
  }

  /**
   * Vérifier si le système actuel est par semestres
   */
  public isSemesterSystem(): boolean {
    return this.getCurrentTermSystem() === 'semester';
  }

  /**
   * Obtenir le nombre de périodes selon le système
   */
  public getPeriodCount(): number {
    return this.isTrimesterSystem() ? 3 : 2;
  }

  /**
   * Obtenir les noms des périodes selon le système
   */
  public getPeriodNames(): string[] {
    if (this.isTrimesterSystem()) {
      return ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'];
    } else {
      return ['1er Semestre', '2ème Semestre'];
    }
  }

  /**
   * Obtenir le nom du système
   */
  public getSystemName(): string {
    return this.isTrimesterSystem() ? 'Trimestre' : 'Semestre';
  }

  /**
   * Obtenir la description du système
   */
  public getSystemDescription(): string {
    if (this.isTrimesterSystem()) {
      return 'Système à 3 trimestres (adapté aux écoles primaires)';
    } else {
      return 'Système à 2 semestres (adapté aux écoles secondaires)';
    }
  }

  /**
   * Réinitialiser le cache (à appeler après mise à jour des paramètres)
   */
  public resetCache(): void {
    this.currentTermSystem = null;
  }
}

export const termSystemManager = TermSystemManager.getInstance();
