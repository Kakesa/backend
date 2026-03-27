import { useState, useEffect } from 'react';
import { helpService } from '@/services/helpService';
import { useAuth } from '@/contexts/AuthContext';

export const useHelpNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    unread: 0,
    resolved: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const markAllAsRead = async () => {
    try {
      await helpService.markAllAsRead();
      // Mettre à jour l'état local
      setNotifications(prev => ({
        ...prev,
        unread: 0
      }));
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
    }
  };

  useEffect(() => {
    // Ne charger les notifications que si l'utilisateur est connecté et n'est pas superadmin
    if (!user || user.role === 'superadmin') {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        console.log('Fetching help notifications for user:', user.id);
        const data = await helpService.getUserRequests(user.id);
        console.log('User help requests received:', data);
        
        // Compter les demandes non lues (résolues ou avec réponse)
        const unread = data.filter(request => 
          request.status === 'resolved' && 
          request.adminResponse && 
          !request.readByUser
        ).length;
        
        const resolved = data.filter(request => request.status === 'resolved').length;
        const total = data.length;

        setNotifications({
          unread,
          resolved,
          total
        });
      } catch (error) {
        console.error('Erreur récupération notifications aide:', error);
        // Valeurs par défaut en cas d'erreur
        setNotifications({
          unread: 0,
          resolved: 0,
          total: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return { notifications, loading, markAllAsRead };
};
