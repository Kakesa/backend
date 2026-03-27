// ==========================================
// CALENDAR TYPES
// ==========================================

export type CalendarEventType = 
  | "school" 
  | "exam" 
  | "meeting" 
  | "holiday" 
  | "assignment" 
  | "event"
  | "conference"
  | "workshop"
  | "competition"
  | "celebration";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  date?: string; // Gardé pour compatibilité avec anciennes données
  endDate?: string; // Gardé pour compatibilité avec anciennes données
  startTime?: string;
  endTime?: string;
  type: CalendarEventType;
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  location?: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurrenceRule?: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCalendarEventDTO {
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type: CalendarEventType;
  classId?: string;
  subjectId?: string;
  location?: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateCalendarEventDTO extends Partial<CreateCalendarEventDTO> {}

export interface CalendarFilter {
  startDate?: string;
  endDate?: string;
  type?: CalendarEventType[];
  classId?: string;
}
