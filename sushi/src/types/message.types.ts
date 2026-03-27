// ==========================================
// MESSAGE TYPES
// ==========================================

import { UserRole } from "./user.types";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  attachments?: string[];
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
  unreadCount?: number;
}

export interface CreateMessageDTO {
  recipientId: string;
  subject: string;
  content: string;
  attachments?: string[];
}

export interface CreateBulkMessageDTO {
  subject: string;
  content: string;
  recipientRole: "parent" | "teacher" | "student" | "admin";
  attachments?: string[];
}

export interface BroadcastMessage extends Message {
  recipientList?: string[];
  isBroadcast?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: string[];
}

export interface CreateChatMessageDTO {
  conversationId: string;
  content: string;
  attachments?: string[];
}
