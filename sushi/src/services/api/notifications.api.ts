/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./client";

export interface Notification {
  id: string;
  type:
    | "rappel_devoir"
    | "message"
    | "note"
    | "absence"
    | "evenement"
    | "systeme";
  title: string;
  message: string;
  recipientId: string;
  recipientType: "student" | "teacher" | "parent" | "admin";
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  link?: string;
  metadata?: Record<string, any>;
}

export interface EmailReminder {
  id: string;
  assignmentId: string;
  studentId: string;
  scheduledAt: string;
  sentAt?: string;
  status: "pending" | "sent" | "failed";
  type: "24h" | "3j" | "1semaine";
}

// Récupérer toutes les notifications d'un utilisateur
export const apiGetNotifications = async (
  userId: string,
  userType: string,
): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(
    `/notifications/user/${userId}`,
    { params: { userType } },
  );

  // Handle different response formats safely
  const rawData = response.data;
  if (rawData && typeof rawData === "object") {
    if (Array.isArray(rawData.data)) return rawData.data;
    if (Array.isArray(rawData)) return rawData;
  }

  return [];
};

// Récupérer les notifications non lues
export const apiGetUnreadNotifications = async (
  userId: string,
  userType: string,
): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(
    `/notifications/unread/${userId}`,
    { params: { userType } },
  );
  return response.data.data || [];
};

// Marquer une notification comme lue
export const apiMarkNotificationAsRead = async (
  notificationId: string,
): Promise<Notification | undefined> => {
  const response = await api.put<Notification>(
    `/notifications/${notificationId}/read`,
  );
  return response.data.data;
};

// Marquer toutes les notifications comme lues
export const apiMarkAllNotificationsAsRead = async (
  userId: string,
  userType: string,
): Promise<void> => {
  await api.put(`/notifications/read-all/${userId}`, { userType });
};

// Créer une notification
export const apiCreateNotification = async (
  notification: Omit<Notification, "id" | "createdAt" | "isRead">,
): Promise<Notification> => {
  const response = await api.post<Notification>("/notifications", notification);
  return response.data.data!;
};

// Supprimer une notification
export const apiDeleteNotification = async (
  notificationId: string,
): Promise<boolean> => {
  await api.delete(`/notifications/${notificationId}`);
  return true;
};

// Supprimer toutes les notifications d'un utilisateur
export const apiClearAllNotifications = async (
  userId: string,
): Promise<boolean> => {
  await api.delete(`/notifications/user/${userId}/clear`);
  return true;
};

// ==========================================
// RAPPELS EMAIL AUTOMATIQUES
// ==========================================

// Programmer un rappel email
export const apiScheduleEmailReminder = async (
  assignmentId: string,
  studentId: string,
  reminderType: "24h" | "3j" | "1semaine",
): Promise<EmailReminder> => {
  const response = await api.post<EmailReminder>("/notifications/reminders", {
    assignmentId,
    studentId,
    type: reminderType,
  });
  return response.data.data!;
};

// Récupérer les rappels programmés
export const apiGetScheduledReminders = async (
  assignmentId?: string,
): Promise<EmailReminder[]> => {
  const response = await api.get<EmailReminder[]>("/notifications/reminders", {
    params: { assignmentId },
  });
  return response.data.data || [];
};

// Envoyer les rappels en attente (à appeler par un cron job côté backend)
export const apiSendPendingReminders = async (): Promise<{
  sent: number;
  failed: number;
}> => {
  const response = await api.post<{ sent: number; failed: number }>(
    "/notifications/reminders/send-pending",
  );
  return response.data.data!;
};

// Annuler un rappel
export const apiCancelReminder = async (
  reminderId: string,
): Promise<boolean> => {
  await api.delete(`/notifications/reminders/${reminderId}`);
  return true;
};
