import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  apiGetInboxMessages,
  apiGetUnreadCount,
} from "@/services/api/messages.api";
import type { Message } from "@/types";

// Simple notification sound (base64 encoded short beep)
const notificationSoundUrl =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoEC3rE79GoSwAAOavW8axWAAAMf8XyrmEOAAA5t+TpomAOBB5Sss3gxGQgABdJosLPtUASAApAtb7awU4NABBEpbnDtEUKAA1ArLbBuTwCAAdBr7rCuT0GAA9HtMHJxEEIABhQt8jSy0kMAB1TvczX0FQQACBX";

export interface NotificationState {
  unreadCount: number;
  lastChecked: string;
  soundEnabled: boolean;
}

export function useMessageNotifications(userId: string) {
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousMessagesRef = useRef<Set<string>>(new Set());

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(notificationSoundUrl);
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.log("Audio play blocked by browser");
      });
    }
  }, [soundEnabled]);

  const checkNewMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const [inboxMessages, count] = await Promise.all([
        apiGetInboxMessages(userId),
        apiGetUnreadCount(userId),
      ]);

      setUnreadCount(count);

      // Check for new messages
      const newMessages = inboxMessages.filter(
        (m: Message) => !previousMessagesRef.current.has(m.id),
      );

      // Don't notify on first load (would notify for ALL existing messages)
      if (previousMessagesRef.current.size > 0) {
        newMessages.forEach((message: Message) => {
          if (!message.read) {
            playNotificationSound();
            toast({
              title: `Nouveau message de ${message.senderName}`,
              description: message.subject,
              duration: 5000,
            });
          }
        });
      }

      // Update known messages
      inboxMessages.forEach((m: Message) =>
        previousMessagesRef.current.add(m.id),
      );
    } catch (error) {
      console.error("Erreur vérification messages:", error);
    }
  }, [userId, toast, playNotificationSound]);

  // Initial check and set up polling
  useEffect(() => {
    checkNewMessages();

    // Poll for new messages every 30 seconds
    const interval = setInterval(checkNewMessages, 30000);

    return () => clearInterval(interval);
  }, [checkNewMessages]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await apiGetUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Erreur refresh unread:", error);
    }
  }, [userId]);

  return {
    unreadCount,
    soundEnabled,
    toggleSound,
    refreshUnreadCount,
    checkNewMessages,
  };
}
