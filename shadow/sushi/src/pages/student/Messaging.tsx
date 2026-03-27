import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetAvailableContacts } from "@/services/api/messages.api";
import type { Contact } from "@/types";
import RealtimeChat, { type ChatContact } from "@/components/messaging/RealtimeChat";

export default function StudentMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const userId = user?.id || "";

  const fetchData = useCallback(async (isBackground = false) => {
    if (!userId) return;
    try {
      if (!isBackground) setLoading(true);
      const contactsList = await apiGetAvailableContacts();
      setContacts(contactsList);
    } catch (error) {
      console.error("Erreur chargement messagerie:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les contacts.",
      });
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000); // Rafraîchir les contacts toutes les 15s en arrière-plan
    return () => clearInterval(interval);
  }, [fetchData]);

  const chatContacts: ChatContact[] = useMemo(() => contacts.map((contact, index) => ({
    id: contact.id,
    name: contact.name,
    role: contact.role,
    unreadCount: contact.unreadCount,
    isOnline: index % 3 === 0,
    lastSeen: "il y a 2h",
  })), [contacts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messagerie</h1>
          <p className="text-muted-foreground">Communiquez avec les professeurs, parents et l'administration</p>
        </div>
      </div>

      <RealtimeChat
        currentUserId={userId}
        currentUserName={`${user?.firstName || "Élève"} ${user?.lastName || ""}`}
        contacts={chatContacts}
      />
    </div>
  );
}
