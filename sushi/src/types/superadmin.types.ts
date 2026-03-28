// ==========================================
// SUPER ADMIN TYPES
// ==========================================

export type SubscriptionStatus = "active" | "expired" | "pending_activation" | "trial";

export interface SchoolSubscription {
  schoolId: string;
  plan: "basic" | "standard" | "premium";
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  lastPaymentDate?: string;
  autoRenew: boolean;
}

export interface SchoolWithStats {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  types: string;
  academicYear: string;
  status: "active" | "inactive";
  createdAt: string;
  adminName: string;
  adminEmail: string;
  studentCount: number;
  teacherCount: number;
  classCount: number;
  subscription: SchoolSubscription;
}

export interface GlobalStats {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  subscriptions: {
    active: number;
    expired: number;
    pendingActivation: number;
    trial: number;
  };
  revenue: {
    monthly: number;
    annual: number;
    currency: string;
  };
}

export interface SchoolActivity {
  id: string;
  schoolId: string;
  schoolName: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  type: "subscription_reminder" | "payment_due" | "account_activation" | "general";
}

export interface SuperAdminSettings {
  emailNotifications: boolean;
  autoSuspendOnExpiry: boolean;
  trialDurationDays: number;
  reminderDaysBeforeExpiry: number[];
}

// Données historiques pour les graphiques
export interface MonthlyStats {
  month: string;
  year: number;
  newSchools: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  revenue: number;
  newStudents: number;
}

export interface RevenueByPlan {
  plan: "basic" | "standard" | "premium";
  amount: number;
  count: number;
}

// Types pour Mobile Money
export type MobileMoneyProvider = "mpesa" | "orange_money" | "airtel_money" | "africell";

export interface MobileMoneyPayment {
  id: string;
  schoolId: string;
  amount: number;
  currency: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  transactionId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}
