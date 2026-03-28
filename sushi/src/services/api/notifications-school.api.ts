// ==========================================
// SCHOOL JOIN NOTIFICATIONS API
// ==========================================

import { api } from './client';

export interface NewUserJoinedNotification {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userRole: string;
  schoolId: string;
  schoolName: string;
  joinedAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  adminEmails: string[];
  adminPhones: string[];
}

interface NotifyResponse {
  success?: boolean;
  message?: string;
  data?: {
    success?: boolean;
    message?: string;
  };
}

interface PreferencesResponse {
  data?: NotificationPreferences;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  adminEmails?: string[];
  adminPhones?: string[];
}

// POST /notifications/user-joined - Envoyer une notification quand un utilisateur rejoint l'école
export const apiNotifyNewUserJoined = async (
  notification: NewUserJoinedNotification
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post<NotifyResponse>('/notifications/user-joined', notification);
    const result = response.data;
    return {
      success: result?.data?.success ?? result?.success ?? true,
      message: result?.data?.message ?? result?.message ?? 'Notification envoyée'
    };
  } catch {
    return { success: false, message: 'Erreur lors de l\'envoi de la notification' };
  }
};

// GET /schools/current/notification-preferences - Récupérer les préférences de notification
export const apiGetNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const response = await api.get<PreferencesResponse>('/schools/current/notification-preferences');
    const result = response.data;
    const data = result?.data ?? result;
    return {
      emailEnabled: data?.emailEnabled ?? true,
      smsEnabled: data?.smsEnabled ?? false,
      adminEmails: data?.adminEmails ?? [],
      adminPhones: data?.adminPhones ?? [],
    };
  } catch {
    return {
      emailEnabled: true,
      smsEnabled: false,
      adminEmails: [],
      adminPhones: [],
    };
  }
};

// PUT /schools/current/notification-preferences - Mettre à jour les préférences de notification
export const apiUpdateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  try {
    const response = await api.put<PreferencesResponse>('/schools/current/notification-preferences', preferences);
    const result = response.data;
    const data = result?.data ?? result;
    return {
      emailEnabled: data?.emailEnabled ?? preferences.emailEnabled ?? true,
      smsEnabled: data?.smsEnabled ?? preferences.smsEnabled ?? false,
      adminEmails: data?.adminEmails ?? preferences.adminEmails ?? [],
      adminPhones: data?.adminPhones ?? preferences.adminPhones ?? [],
    };
  } catch {
    return {
      emailEnabled: preferences.emailEnabled ?? true,
      smsEnabled: preferences.smsEnabled ?? false,
      adminEmails: preferences.adminEmails ?? [],
      adminPhones: preferences.adminPhones ?? [],
    };
  }
};
