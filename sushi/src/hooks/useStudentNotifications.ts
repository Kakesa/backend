import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiGetUnreadCount, apiMarkAllMessagesAsRead } from "@/services/api/messages.api";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetAssignmentsByStudent } from "@/services/api/assignments.api";
import { apiGetGradesByStudent } from "@/services/api/grades.api";
import { apiGetMyFees } from "@/services/api/fees.api";

export interface NotificationCounts {
  messages: number;
  grades: number;
  assignments: number;
  fees: number;
}

interface LastViewedState {
  grades?: string;
  assignments?: string;
  fees?: string;
}

const getStorageKey = (userId: string) =>
  `student_notifications_last_viewed_${userId}`;

export function useStudentNotifications(userId: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    messages: 0,
    grades: 0,
    assignments: 0,
    fees: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchNotificationCounts = useCallback(async () => {
    if (!userId) return;

    try {
      let lastViewed: LastViewedState = {};
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(getStorageKey(userId));
          if (raw) lastViewed = JSON.parse(raw);
        } catch {
          lastViewed = {};
        }
      }

      const newCounts: NotificationCounts = {
        messages: 0,
        grades: 0,
        assignments: 0,
        fees: 0,
      };

      // 1. Messages non lus
      const unreadCount = await apiGetUnreadCount(userId).catch(() => 0);
      newCounts.messages = unreadCount || 0;

      // 2. Badges spécifiques élève (si connecté comme élève)
      if (user && user.role === "student" && user.linkedId) {
        try {
          const studentProfile = (user as any).linkedProfile;
          const classId =
            studentProfile?.class?._id || studentProfile?.classId;

          // Devoirs: nombre de nouveaux devoirs sans soumission depuis la dernière vue
          if (classId) {
            const assignments = await apiGetAssignmentsByStudent(
              user.linkedId,
              classId
            );
            const lastAssignmentsViewed = lastViewed.assignments
              ? new Date(lastViewed.assignments)
              : null;
            newCounts.assignments = assignments.filter((a: any) => {
              const createdAt = a.createdAt ? new Date(a.createdAt) : null;
              const isNew =
                !lastAssignmentsViewed ||
                (createdAt && createdAt > lastAssignmentsViewed);
              const hasSubmitted = a.submissions?.some(
                (s: any) =>
                  s.studentId === user.linkedId ||
                  (typeof s.studentId === "object" &&
                    (s.studentId as any)._id === user.linkedId)
              );
              return isNew && !hasSubmitted;
            }).length;
          }

          // Notes: créées dans les 7 derniers jours
          const grades = await apiGetGradesByStudent(user.linkedId);
          const lastGradesViewed = lastViewed.grades
            ? new Date(lastViewed.grades)
            : null;
          newCounts.grades = grades.filter((g: any) => {
            const createdAt = g.createdAt ? new Date(g.createdAt) : null;
            if (!createdAt) return false;
            return !lastGradesViewed || createdAt > lastGradesViewed;
          }).length;

          // Frais: nouveaux frais avec un solde > 0 depuis la dernière vue
          const fees = await apiGetMyFees();
          const lastFeesViewed = lastViewed.fees
            ? new Date(lastViewed.fees)
            : null;
          newCounts.fees = fees.filter((f: any) => {
            const createdAt = f.createdAt ? new Date(f.createdAt) : null;
            if (!createdAt || f.balance <= 0) return false;
            return !lastFeesViewed || createdAt > lastFeesViewed;
          }).length;
        } catch (error) {
          console.error("Erreur lors du chargement des badges élève:", error);
        }
      }

      setCounts(newCounts);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotificationCounts();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificationCounts]);

  // Marquer tous les messages comme lus et réinitialiser le compteur
  const markMessagesAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await apiMarkAllMessagesAsRead(userId);
      setCounts((prev) => ({ ...prev, messages: 0 }));
    } catch (error) {
      console.error("Erreur lors du marquage des messages:", error);
    }
  }, [userId]);

  // Marquer les notes comme consultées
  const markGradesAsViewed = useCallback(() => {
    if (typeof window !== "undefined" && userId) {
      try {
        const raw = window.localStorage.getItem(getStorageKey(userId));
        const current: LastViewedState = raw ? JSON.parse(raw) : {};
        const updated: LastViewedState = {
          ...current,
          grades: new Date().toISOString(),
        };
        window.localStorage.setItem(
          getStorageKey(userId),
          JSON.stringify(updated)
        );
      } catch {
        // ignore storage errors
      }
    }
    setCounts((prev) => ({ ...prev, grades: 0 }));
  }, []);

  // Marquer les devoirs comme consultés
  const markAssignmentsAsViewed = useCallback(() => {
    if (typeof window !== "undefined" && userId) {
      try {
        const raw = window.localStorage.getItem(getStorageKey(userId));
        const current: LastViewedState = raw ? JSON.parse(raw) : {};
        const updated: LastViewedState = {
          ...current,
          assignments: new Date().toISOString(),
        };
        window.localStorage.setItem(
          getStorageKey(userId),
          JSON.stringify(updated)
        );
      } catch {
        // ignore storage errors
      }
    }
    setCounts((prev) => ({ ...prev, assignments: 0 }));
  }, []);

  // Marquer les frais comme consultés
  const markFeesAsViewed = useCallback(() => {
    if (typeof window !== "undefined" && userId) {
      try {
        const raw = window.localStorage.getItem(getStorageKey(userId));
        const current: LastViewedState = raw ? JSON.parse(raw) : {};
        const updated: LastViewedState = {
          ...current,
          fees: new Date().toISOString(),
        };
        window.localStorage.setItem(
          getStorageKey(userId),
          JSON.stringify(updated)
        );
      } catch {
        // ignore storage errors
      }
    }
    setCounts((prev) => ({ ...prev, fees: 0 }));
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchNotificationCounts();
  }, [fetchNotificationCounts]);

  return {
    counts,
    loading,
    refetch,
    markMessagesAsRead,
    markGradesAsViewed,
    markAssignmentsAsViewed,
    markFeesAsViewed,
  };
}
