// ==========================================
// SUPER ADMIN API - Connecté au backend réel
// ==========================================

import apiClient from './client';
import type { 
  SchoolWithStats, 
  GlobalStats, 
  SchoolActivity,
  SchoolSubscription,
  SuperAdminSettings,
  EmailNotification 
} from '@/types/superadmin.types';

// GET /api/superadmin/schools
export const apiGetAllSchoolsWithStats = async (): Promise<SchoolWithStats[]> => {
  const response = await apiClient.get<{ data: SchoolWithStats[] }>(
    '/superadmin/schools'
  );
  return response.data.data;
};


// GET /superadmin/schools/:id
export const apiGetSchoolWithStatsById = async (id: string): Promise<SchoolWithStats | undefined> => {
  const response = await apiClient.get<{ data: SchoolWithStats }>(`/superadmin/schools/${id}`);
  return response.data.data || response.data as unknown as SchoolWithStats;
};

// GET /superadmin/stats
export const apiGetGlobalStats = async (): Promise<GlobalStats> => {
  const response = await apiClient.get<{ data: GlobalStats }>('/superadmin/stats');
  return response.data.data || response.data as unknown as GlobalStats;
};

// GET /api/superadmin/activities
export const apiGetSchoolActivities = async (
  limit?: number
): Promise<SchoolActivity[]> => {
  const response = await apiClient.get<{ data: SchoolActivity[] }>(
    '/superadmin/activities',
    {
      params: { limit },
    }
  );
  return response.data.data;
};


// PUT /superadmin/schools/:id/subscription
export const apiUpdateSchoolSubscription = async (
  schoolId: string, 
  updates: Partial<SchoolSubscription>
): Promise<SchoolSubscription | undefined> => {
  const response = await apiClient.put<{ data: SchoolSubscription }>(
    `/superadmin/schools/${schoolId}/subscription`, 
    updates
  );
  return response.data.data || response.data as unknown as SchoolSubscription;
};

// PUT /superadmin/schools/:id/toggle-status
export const apiToggleSchoolStatus = async (schoolId: string): Promise<SchoolWithStats | undefined> => {
  const response = await apiClient.put<{ data: SchoolWithStats }>(`/superadmin/schools/${schoolId}/toggle-status`);
  return response.data.data || response.data as unknown as SchoolWithStats;
};

// POST /superadmin/activities
export const apiAddSchoolActivity = async (
  activity: Omit<SchoolActivity, "id">
): Promise<SchoolActivity> => {
  const response = await apiClient.post<{ data: SchoolActivity }>('/superadmin/activities', activity);
  return response.data.data || response.data as unknown as SchoolActivity;
};

// GET /superadmin/settings
export const apiGetSuperAdminSettings = async (): Promise<SuperAdminSettings> => {
  const response = await apiClient.get<{ data: SuperAdminSettings }>('/superadmin/settings');
  return response.data.data || response.data as unknown as SuperAdminSettings;
};

// PUT /superadmin/settings
export const apiUpdateSuperAdminSettings = async (
  updates: Partial<SuperAdminSettings>
): Promise<SuperAdminSettings> => {
  const response = await apiClient.put<{ data: SuperAdminSettings }>('/superadmin/settings', updates);
  return response.data.data || response.data as unknown as SuperAdminSettings;
};

// GET /superadmin/schools/by-subscription-status/:status
export const apiGetSchoolsBySubscriptionStatus = async (
  status: SchoolSubscription["status"]
): Promise<SchoolWithStats[]> => {
  const response = await apiClient.get<{ data: SchoolWithStats[] }>(
    `/superadmin/schools/by-subscription-status/${status}`
  );
  return response.data.data || response.data as unknown as SchoolWithStats[];
};

// POST /superadmin/send-email
export const apiSendEmailNotification = async (
  notification: EmailNotification
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/superadmin/send-email', 
    notification
  );
  return response.data;
};

// POST /superadmin/schools/:id/send-reminder
export const apiSendSubscriptionReminder = async (
  schoolId: string,
  type: "payment_due" | "subscription_reminder" | "account_activation"
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    `/superadmin/schools/${schoolId}/send-reminder`,
    { type }
  );
  return response.data;
};

// ==========================================
// SUBSCRIPTION API pour les écoles
// ==========================================

// GET /schools/subscription - Récupère l'abonnement de l'école courante
export const apiGetCurrentSchoolSubscription = async (): Promise<SchoolSubscription> => {
  const response = await apiClient.get<{ data: SchoolSubscription }>('/schools/subscription');
  return response.data.data || response.data as unknown as SchoolSubscription;
};

// POST /schools/subscription/renew - Renouveler l'abonnement via Mobile Money
export const apiRenewSubscription = async (paymentData: {
  plan: string;
  provider: string;
  phoneNumber: string;
  amount: number;
  currency: string;
}): Promise<{ success: boolean; message: string; transactionId?: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string; transactionId?: string }>(
    '/schools/subscription/renew',
    paymentData
  );
  return response.data;
};

// ==========================================
// NOTIFICATIONS API
// ==========================================

// POST /notifications/subscription-expiry - Envoyer notification d'expiration
export const apiSendExpiryNotification = async (
  schoolId: string,
  daysRemaining: number
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/notifications/subscription-expiry',
    { schoolId, daysRemaining }
  );
  return response.data;
};
