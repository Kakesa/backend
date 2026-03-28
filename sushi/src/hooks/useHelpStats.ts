import { useState, useEffect } from 'react';
import { helpService } from '@/services/helpService';
import { useAuth } from '@/contexts/AuthContext';

export const useHelpStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ne charger les stats que si l'utilisateur est superadmin
    if (!user || user.role !== 'superadmin') {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        console.log('Fetching help stats...');
        const data = await helpService.getStats();
        console.log('Help stats received:', data);
        setStats({
          pending: data.pending,
          total: data.total
        });
      } catch (error) {
        console.error('Erreur récupération stats aide:', error);
        // Valeurs par défaut en cas d'erreur
        setStats({
          pending: 0,
          total: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return { stats, loading };
};
