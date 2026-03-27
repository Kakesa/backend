/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  apiGetNotifications,
  apiMarkNotificationAsRead,
  apiMarkAllNotificationsAsRead,
  apiClearAllNotifications,
  type Notification,
} from "@/services/api/notifications.api";
import { useAuth } from "@/contexts/AuthContext";

export interface GradeNotification {
  id: string;
  studentName: string;
  subjectName: string;
  grade: number;
  read: boolean;
  message: string;
  type: string;
  createdAt: Date;
}

export interface UseParentNotificationsReturn {
  notifications: GradeNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

export const useParentNotifications = (
  parentId: string,
): UseParentNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialiser l'audio
  useEffect(() => {
    audioRef.current = new Audio("/notification-sound.mp3");
    audioRef.current.volume = 0.5;

    return () => {
      audioRef.current = null;
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignorer les erreurs de lecture audio
      });
    }
  }, [soundEnabled]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      // On suppose que le parent est connecté et que son ID est user.id
      // ou user.linkedId selon l'implémentation backend
      const data = await apiGetNotifications(user.id, "parent");
      setNotifications(data);
    } catch (error: any) {
      console.error("Erreur détaillée lors du chargement des notifications:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId: user?.id,
      });
      // Optionnel: toast.error("Impossible de charger certaines notifications");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Chargement initial et polling
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      // Polling toutes les minutes pour de nouvelles notifs
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, user?.id]);

  // Détecter les nouvelles notifications pour jouer un son
  // (Simple implémentation : si le nombre de non-lues augmente)
  const prevUnreadCountRef = useRef(0);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      playNotificationSound();
      toast.info("Vous avez de nouvelles notifications");
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, playNotificationSound]);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
    toast.info(
      soundEnabled
        ? "Notifications sonores désactivées"
        : "Notifications sonores activées",
    );
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      await apiMarkNotificationAsRead(id);
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      await apiMarkAllNotificationsAsRead(user.id, "parent");
    } catch (error) {
      console.error("Erreur markAllAsRead:", error);
      fetchNotifications();
    }
  };

  const clearNotifications = async () => {
    if (!user?.id) return;
    try {
      setNotifications([]);
      await apiClearAllNotifications(user.id);
      toast.success("Toutes les notifications ont été supprimées");
    } catch (error) {
      console.error("Erreur clearNotifications:", error);
      fetchNotifications();
    }
  };

  const refreshNotifications = async () => {
    setIsLoading(true);
    await fetchNotifications();
  };

  // Mapper generic notifications to GradeNotification
  const gradeNotifications: GradeNotification[] = notifications.map((n) => ({
    id: n.id,
    studentName: n.metadata?.studentName || n.title || "Élève",
    subjectName: n.metadata?.subjectName || n.message || "Matière",
    grade: n.metadata?.grade || 0,
    read: n.isRead,
    message: n.message,
    type: n.type,
    createdAt: new Date(n.createdAt),
  }));

  return {
    notifications: gradeNotifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications,
    isLoading,
  };
};
