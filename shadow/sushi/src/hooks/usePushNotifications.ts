/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { apiGetInboxMessages } from "@/services/api/messages.api";
import {
  apiGetAllAssignments,
  apiGetAssignmentsByStudent,
} from "@/services/api/assignments.api";
import type { Message, Assignment } from "@/types";

export interface PushNotification {
  id: string;
  type: "message" | "homework_reminder" | "grade" | "event";
  title: string;
  body: string;
  data?: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

interface UsePushNotificationsReturn {
  notifications: PushNotification[];
  unreadCount: number;
  permission: NotificationPermission | "default";
  soundEnabled: boolean;
  toggleSound: () => void;
  requestPermission: () => Promise<boolean>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Son de notification simple
const notificationSoundUrl =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoEC3rE79GoSwAAOavW8axWAAAMf8XyrmEOAAA5t+TpomAOBB5Sss3gxGQgABdJosLPtUASAApAtb7awU4NABBEpbnDtEUKAA1ArLbBuTwCAAdBr7rCuT0GAA9HtMHJxEEIABhQt8jSy0kMAB1TvczX0FQQACBX";

export const usePushNotifications = (
  userId: string,
  userRole: string,
): UsePushNotificationsReturn => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [permission, setPermission] = useState<
    NotificationPermission | "default"
  >("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckRef = useRef<Date>(new Date());
  const previousMessageIdsRef = useRef<Set<string>>(new Set());
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);

  // Initialiser audio
  useEffect(() => {
    audioRef.current = new Audio(notificationSoundUrl);
    audioRef.current.volume = 0.5;

    // Vérifier la permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Charger les notifications sauvegardées
    const saved = localStorage.getItem(`push_notifications_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(
          parsed.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          })),
        );
      } catch (e) {
        console.error("Error loading saved notifications", e);
      }
    }

    return () => {
      audioRef.current = null;
    };
  }, [userId]);

  // Sauvegarder les notifications
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(
        `push_notifications_${userId}`,
        JSON.stringify(notifications),
      );
    }
  }, [notifications, userId]);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.log("Audio play blocked by browser");
      });
    }
  }, [soundEnabled]);

  const showBrowserNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: icon || "/favicon.ico",
          badge: "/favicon.ico",
          tag: `notif_${Date.now()}`,
        });
      }
    },
    [],
  );

  const addNotification = useCallback(
    (notification: Omit<PushNotification, "id" | "createdAt" | "read">) => {
      const newNotification: PushNotification = {
        ...notification,
        id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 100));
      playNotificationSound();

      // Afficher la notification native du navigateur
      showBrowserNotification(notification.title, notification.body);

      // Afficher un toast
      toast.info(notification.title, {
        description: notification.body,
        duration: 5000,
      });
    },
    [playNotificationSound, showBrowserNotification],
  );

  // Vérifier les nouveaux messages via API
  const checkNewMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const inboxMessages = await apiGetInboxMessages(userId);

      // Détecter les nouveaux messages (skip first load)
      if (previousMessageIdsRef.current.size > 0) {
        inboxMessages.forEach((message: Message) => {
          if (!previousMessageIdsRef.current.has(message.id) && !message.read) {
            addNotification({
              type: "message",
              title: `Nouveau message de ${message.senderName}`,
              body: message.subject,
              data: { messageId: message.id },
            });
          }
        });
      }

      // Mettre à jour les IDs connus
      inboxMessages.forEach((m: Message) =>
        previousMessageIdsRef.current.add(m.id),
      );
    } catch (error) {
      console.error("Erreur vérification messages:", error);
    }
  }, [userId, addNotification]);

  // Charger les devoirs
  const loadAssignments = useCallback(async () => {
    if (!userId) return;
    try {
      let data: Assignment[] = [];
      if (userRole === "student") {
        data = await apiGetAssignmentsByStudent(userId);
      } else {
        data = await apiGetAllAssignments();
      }
      setActiveAssignments(data);
    } catch (error) {
      console.error("Erreur chargement devoirs pour notifications:", error);
    }
  }, [userId, userRole]);

  // Vérifier les rappels de devoirs
  const checkHomeworkReminders = useCallback(() => {
    const now = new Date();

    activeAssignments.forEach((assignment) => {
      if (assignment.status !== "published") return;

      const dueDate = new Date(assignment.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      const reminderKey = `reminder_${assignment.id}_${daysUntilDue}`;
      const alreadyNotified = localStorage.getItem(reminderKey);

      if (!alreadyNotified) {
        if (daysUntilDue === 1) {
          localStorage.setItem(reminderKey, "true");
          addNotification({
            type: "homework_reminder",
            title: "Devoir à rendre demain !",
            body: `"${assignment.title}" doit être rendu demain`,
            data: { assignmentId: assignment.id },
          });
        } else if (daysUntilDue === 3) {
          localStorage.setItem(reminderKey, "true");
          addNotification({
            type: "homework_reminder",
            title: "Rappel de devoir",
            body: `"${assignment.title}" doit être rendu dans 3 jours`,
            data: { assignmentId: assignment.id },
          });
        }
      }
    });
  }, [activeAssignments, addNotification]);

  // Polling pour vérifier les notifications
  useEffect(() => {
    if (!userId) return;

    // Vérification initiale
    checkNewMessages();
    loadAssignments();

    // Vérifier toutes les 30 secondes
    const interval = setInterval(() => {
      checkNewMessages();
      checkHomeworkReminders();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, checkNewMessages, loadAssignments, checkHomeworkReminders]);

  // Déclencher checkHomeworkReminders quand les devoirs changent
  useEffect(() => {
    if (activeAssignments.length > 0) {
      checkHomeworkReminders();
    }
  }, [activeAssignments, checkHomeworkReminders]);

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error("Les notifications ne sont pas supportées par ce navigateur");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Notifications activées !");
        return true;
      } else if (result === "denied") {
        toast.error(
          "Notifications bloquées. Vous pouvez les réactiver dans les paramètres du navigateur.",
        );
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      toast.info(
        newValue
          ? "Son des notifications activé"
          : "Son des notifications désactivé",
      );
      return newValue;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(`push_notifications_${userId}`);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    permission,
    soundEnabled,
    toggleSound,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};
