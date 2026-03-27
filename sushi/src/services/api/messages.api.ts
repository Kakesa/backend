/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// MESSAGES API
// ==========================================

import { api } from "./client";
import type {
  Message,
  Conversation,
  Contact,
  CreateMessageDTO,
  CreateBulkMessageDTO,
  ChatMessage,
  CreateChatMessageDTO,
} from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeMessage = (m: any): Message => {
  const sender =
    m.senderId && typeof m.senderId === "object" ? m.senderId : null;
  const recipient =
    m.recipientId && typeof m.recipientId === "object" ? m.recipientId : null;
  return {
    id: m._id || m.id,
    senderId: sender ? sender._id || sender.id : m.senderId,
    senderName: sender?.name || m.senderName || "Inconnu",
    senderRole: sender?.role || m.senderRole || "admin",
    recipientId: recipient ? recipient._id || recipient.id : m.recipientId,
    recipientName: recipient?.name || m.recipientName || "Inconnu",
    recipientRole: recipient?.role || m.recipientRole || "admin",
    subject: m.subject,
    content: m.content,
    timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
    read: m.isRead ?? m.read ?? false,
    archived: m.isArchived ?? m.archived ?? false,
    attachments: m.attachments,
    schoolId: m.schoolId,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

// GET /messages/user/:userId
export const apiGetMessagesByUser = async (
  userId: string,
): Promise<Message[]> => {
  const response = await api.get(`/messages/user/${userId}`);
  const raw = response.data.data || response.data || [];
  return (Array.isArray(raw) ? raw : []).map(normalizeMessage);
};

// GET /messages/inbox/:userId
export const apiGetInboxMessages = async (
  userId: string,
): Promise<Message[]> => {
  const response = await api.get(`/messages/inbox/${userId}`);
  const raw = response.data.data || response.data || [];
  return (Array.isArray(raw) ? raw : []).map(normalizeMessage);
};

// GET /messages/sent/:userId
export const apiGetSentMessages = async (
  userId: string,
): Promise<Message[]> => {
  const response = await api.get(`/messages/sent/${userId}`);
  const raw = response.data.data || response.data || [];
  return (Array.isArray(raw) ? raw : []).map(normalizeMessage);
};

// GET /messages/unread-count/:userId
export const apiGetUnreadCount = async (userId: string): Promise<number> => {
  const response = await api.get<{ count: number }>(
    `/messages/unread-count/${userId}`,
  );
  return response.data.data?.count ?? response.data.count ?? 0;
};

// PUT /messages/:id/read
export const apiMarkMessageAsRead = async (
  messageId: string,
): Promise<void> => {
  await api.put(`/messages/${messageId}/read`);
};

// PUT /messages/read-all/:userId
export const apiMarkAllMessagesAsRead = async (
  userId: string,
): Promise<void> => {
  await api.put(`/messages/read-all/${userId}`);
};

// POST /messages
export const apiSendMessage = async (
  data: CreateMessageDTO & { senderId: string },
): Promise<Message> => {
  const response = await api.post("/messages", data);
  return normalizeMessage(response.data.data || response.data);
};

// DELETE /messages/:id
export const apiDeleteMessage = async (messageId: string): Promise<boolean> => {
  await api.delete(`/messages/${messageId}`);
  return true;
};

// PUT /messages/:id/archive
export const apiArchiveMessage = async (messageId: string): Promise<void> => {
  await api.put(`/messages/${messageId}/archive`);
};

// GET /conversation/:otherId
export const apiGetConversationHistory = async (
  otherId: string,
): Promise<Message[]> => {
  const response = await api.get(`/messages/conversation/${otherId}`);
  const raw = response.data.data || response.data || [];
  return (Array.isArray(raw) ? raw : []).map(normalizeMessage);
};

export const apiMarkConversationAsRead = async (
  otherId: string,
): Promise<void> => {
  await api.put(`/messages/conversation/${otherId}/read`);
};

// GET /contacts/:userRole
export const apiGetAvailableContacts = async (): Promise<Contact[]> => {
  const response = await api.get<Contact[]>(`/messages/contacts`);

  const rawData = response.data as any;
  if (rawData && typeof rawData === "object") {
    if (Array.isArray(rawData.data)) return rawData.data;
    if (Array.isArray(rawData)) return rawData;
  }
  return [];
};

// ==========================================
// CHAT API (temps réel)
// ==========================================

// GET /chat/conversations/:userId
export const apiGetConversations = async (
  userId: string,
): Promise<Conversation[]> => {
  try {
    const response = await api.get<Conversation[]>(
      `/chat/conversations/${userId}`,
    );
    return response.data.data || [];
  } catch {
    return [];
  }
};

// GET /chat/messages/:conversationId
export const apiGetChatMessages = async (
  conversationId: string,
): Promise<ChatMessage[]> => {
  try {
    const response = await api.get<ChatMessage[]>(
      `/chat/messages/${conversationId}`,
    );
    return response.data.data || [];
  } catch {
    return [];
  }
};

// POST /chat/messages
export const apiSendChatMessage = async (
  data: CreateChatMessageDTO & { senderId: string },
): Promise<ChatMessage> => {
  try {
    const response = await api.post<ChatMessage>("/chat/messages", data);
    return response.data.data!;
  } catch {
    return {
      id: "local-" + Date.now(),
      ...data,
      timestamp: new Date().toISOString(),
      read: false,
    } as ChatMessage;
  }
};

// ==========================================
// BULK MESSAGES API (messages en masse)
// ==========================================

export interface SendBulkMessageResponse {
  messageCount: number;
  sentTo: number;
  messages: Message[];
}

// POST /messages/send-to-all-parents - Envoyer un message à tous les parents
export const apiSendMessageToAllParents = async (
  senderId: string,
  schoolId: string,
  data: { subject: string; content: string },
): Promise<SendBulkMessageResponse> => {
  try {
    const response = await api.post("/messages/send-to-all-parents", {
      senderId,
      schoolId,
      subject: data.subject,
      content: data.content,
    });
    return (response.data.data || response.data) as SendBulkMessageResponse;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message en masse:", error);
    throw error;
  }
};

// POST /messages/send-to-all-teachers
export const apiSendMessageToAllTeachers = async (
  senderId: string,
  schoolId: string,
  data: { subject: string; content: string },
): Promise<SendBulkMessageResponse> => {
  try {
    const response = await api.post("/messages/send-to-all-teachers", {
      senderId,
      schoolId,
      subject: data.subject,
      content: data.content,
    });
    return (response.data.data || response.data) as SendBulkMessageResponse;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message en masse:", error);
    throw error;
  }
};

// POST /messages/send-to-all-students
export const apiSendMessageToAllStudents = async (
  senderId: string,
  schoolId: string,
  data: { subject: string; content: string },
): Promise<SendBulkMessageResponse> => {
  try {
    const response = await api.post("/messages/send-to-all-students", {
      senderId,
      schoolId,
      subject: data.subject,
      content: data.content,
    });
    return (response.data.data || response.data) as SendBulkMessageResponse;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message en masse:", error);
    throw error;
  }
};

// GET /messages/bulk-stats/:userId
export const apiGetBulkMessageStats = async (
  userId: string,
): Promise<any[]> => {
  try {
    const response = await api.get(`/messages/bulk-stats/${userId}`);
    return (response.data.data || []) as any[];
  } catch {
    return [];
  }
};

