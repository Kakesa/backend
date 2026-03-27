import { useEffect, useState } from 'react';
import { termSystemManager } from '@/lib/termSystemManager';
import type { TermSystem } from '@/types/school.types';

export function useTermSystem() {
  const [termSystem, setTermSystem] = useState<TermSystem>('trimester');

  useEffect(() => {
    // Initialiser avec le système actuel
    const currentSystem = termSystemManager.getCurrentTermSystem();
    setTermSystem(currentSystem);
  }, []);

  const updateTermSystem = (newSystem: TermSystem) => {
    termSystemManager.setTermSystem(newSystem);
    setTermSystem(newSystem);
  };

  const resetCache = () => {
    termSystemManager.resetCache();
    const currentSystem = termSystemManager.getCurrentTermSystem();
    setTermSystem(currentSystem);
  };

  return {
    termSystem,
    setTermSystem: updateTermSystem,
    resetCache,
    isTrimesterSystem: termSystemManager.isTrimesterSystem(),
    isSemesterSystem: termSystemManager.isSemesterSystem(),
    periodCount: termSystemManager.getPeriodCount(),
    periodNames: termSystemManager.getPeriodNames(),
    systemName: termSystemManager.getSystemName(),
    systemDescription: termSystemManager.getSystemDescription(),
  };
}
