// ==========================================
// CALENDAR API - Calendrier scolaire
// ==========================================

import { api } from "./client";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  date?: string; // Gardé pour compatibilité
  endDate?: string; // Gardé pour compatibilité
  type:
    | "event"
    | "exam"
    | "meeting"
    | "holiday"
    | "conference"
    | "workshop"
    | "competition"
    | "celebration"
    | "devoir"
    | "examen"
    | "evenement"
    | "vacances"
    | "reunion"
    | "tp"
    | "projet"
    | "exposé";
  classId?: string;
  subjectId?: string;
  color?: string;
  allDay?: boolean;
}

// Récupérer tous les événements du calendrier
export const apiGetCalendarEvents = async (
  startDate?: string,
  endDate?: string,
): Promise<CalendarEvent[]> => {
  const response = await api.get<CalendarEvent[]>("/calendar/events", {
    params: { startDate, endDate },
  });
  return response.data.data || [];
};

// Récupérer les événements d'une classe
export const apiGetCalendarEventsByClass = async (
  classId: string,
): Promise<CalendarEvent[]> => {
  const response = await api.get<CalendarEvent[]>(`/calendar/events`, {
    params: { classId },
  });
  return response.data.data || [];
};

// Créer un événement
export const apiCreateCalendarEvent = async (
  event: Omit<CalendarEvent, "id">,
): Promise<CalendarEvent> => {
  const response = await api.post<CalendarEvent>("/calendar/events", event);
  return response.data.data!;
};

// Mettre à jour un événement
export const apiUpdateCalendarEvent = async (
  id: string,
  updates: Partial<CalendarEvent>,
): Promise<CalendarEvent | undefined> => {
  const response = await api.put<CalendarEvent>(
    `/calendar/events/${id}`,
    updates,
  );
  return response.data.data;
};

// Supprimer un événement
export const apiDeleteCalendarEvent = async (id: string): Promise<boolean> => {
  await api.delete(`/calendar/events/${id}`);
  return true;
};

// Récupérer les échéances à venir
export const apiGetUpcomingDeadlines = async (
  days: number = 7,
): Promise<CalendarEvent[]> => {
  const response = await api.get<CalendarEvent[]>("/calendar/upcoming", {
    params: { days },
  });
  return response.data.data || [];
};
