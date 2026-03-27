import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagingLayout } from "./redesign/MessagingLayout";
import { apiGetConversationHistory, apiSendMessage, apiMarkConversationAsRead } from "@/services/api/messages.api";
import type { Message } from "@/types";

export interface ChatContact {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
  unreadCount?: number;
}

interface RealtimeChatProps {
  currentUserId: string;
  currentUserName: string;
  contacts: ChatContact[];
}

export default function RealtimeChat({
  currentUserId,
  contacts,
}: RealtimeChatProps) {
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (contactId: string, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const history = await apiGetConversationHistory(contactId);
      setMessages(history);

      const hasUnread = history.some(m => m.recipientId === currentUserId && !m.read);
      if (hasUnread) {
        await apiMarkConversationAsRead(contactId);
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedContact) {
      fetchHistory(selectedContact.id);
      const interval = setInterval(() => fetchHistory(selectedContact.id, true), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedContact, fetchHistory]);

  const handleSend = async (content: string) => {
    if (!content.trim() || !selectedContact) return;

    try {
      const optimisticMsg: any = {
        id: "temp-" + Date.now(),
        senderId: currentUserId,
        recipientId: selectedContact.id,
        content: content,
        timestamp: new Date().toISOString(),
        read: false,
        type: "text"
      };
      setMessages(prev => [...prev, optimisticMsg]);

      await apiSendMessage({
        senderId: currentUserId,
        recipientId: selectedContact.id,
        subject: "Chat",
        content: content,
      });

      fetchHistory(selectedContact.id);
    } catch (error) {
      console.error("Erreur envoi message:", error);
    }
  };

  return (
    <MessagingLayout
      currentUserId={currentUserId}
      selectedContact={selectedContact}
      contacts={contacts}
      messages={messages}
      onSendMessage={handleSend}
      onSelectContact={setSelectedContact}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      isLoading={loading}
    />
  );
}
