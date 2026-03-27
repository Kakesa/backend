// ==========================================
// NOTIFICATION TYPES
// ==========================================

export type NotificationType = 
  | "grade" 
  | "attendance" 
  | "message" 
  | "event" 
  | "assignment" 
  | "absence" 
  | "reminder";

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  recipientType: "superadmin" | "admin" | "teacher" | "student" | "parent";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  schoolId?: string;
}

export interface ParentNotification {
  id: string;
  type: "grade" | "attendance" | "message" | "event";
  title: string;
  message: string;
  date: string;
  read: boolean;
  childId?: string;
}

export interface EmailReminder {
  id: string;
  assignmentId: string;
  studentId: string;
  reminderType: "24h" | "3j" | "1semaine";
  scheduledFor: string;
  sent: boolean;
  sentAt?: string;
}

export interface CreateNotificationDTO {
  type: NotificationType;
  recipientId: string;
  recipientType: "superadmin" | "admin" | "teacher" | "student" | "parent";
  title: string;
  message: string;
  link?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}
