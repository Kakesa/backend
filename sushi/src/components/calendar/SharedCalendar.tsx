import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, FileText, GraduationCap, Users, Palmtree, Clock } from "lucide-react";
import { apiGetCalendarEvents, apiCreateCalendarEvent, CalendarEvent } from "@/services/api/calendar.api";
import { apiGetAllAssignments } from "@/services/api/assignments.api";
import { format, isSameDay, isWithinInterval, parseISO, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Assignment } from "@/types";

interface SharedCalendarProps {
  userRole: "admin" | "teacher" | "student" | "parent";
  classId?: string;
}

const eventTypeConfig: Record<CalendarEvent["type"], { color: string; icon: React.ReactNode; label: string }> = {
  devoir: { color: "bg-blue-500", icon: <FileText className="h-4 w-4" />, label: "Devoir" },
  tp: { color: "bg-purple-500", icon: <FileText className="h-4 w-4" />, label: "TP" },
  projet: { color: "bg-indigo-500", icon: <FileText className="h-4 w-4" />, label: "Projet" },
  exposé: { color: "bg-pink-500", icon: <Users className="h-4 w-4" />, label: "Exposé" },
  examen: { color: "bg-red-500", icon: <GraduationCap className="h-4 w-4" />, label: "Examen" },
  exam: { color: "bg-red-500", icon: <GraduationCap className="h-4 w-4" />, label: "Examen" },
  evenement: { color: "bg-green-500", icon: <CalendarIcon className="h-4 w-4" />, label: "Événement" },
  event: { color: "bg-green-500", icon: <CalendarIcon className="h-4 w-4" />, label: "Événement" },
  conference: { color: "bg-cyan-500", icon: <Users className="h-4 w-4" />, label: "Conférence" },
  workshop: { color: "bg-emerald-500", icon: <FileText className="h-4 w-4" />, label: "Atelier" },
  competition: { color: "bg-rose-500", icon: <GraduationCap className="h-4 w-4" />, label: "Compétition" },
  celebration: { color: "bg-amber-500", icon: <CalendarIcon className="h-4 w-4" />, label: "Célébration" },
  vacances: { color: "bg-yellow-500", icon: <Palmtree className="h-4 w-4" />, label: "Vacances" },
  holiday: { color: "bg-yellow-500", icon: <Palmtree className="h-4 w-4" />, label: "Vacances" },
  reunion: { color: "bg-orange-500", icon: <Users className="h-4 w-4" />, label: "Réunion" },
  meeting: { color: "bg-orange-500", icon: <Users className="h-4 w-4" />, label: "Réunion" },
};

export function SharedCalendar({ userRole, classId }: SharedCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filter, setFilter] = useState<"all" | "devoirs" | "evenements">("all");
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [calendarEvents, assignmentsData] = await Promise.all([
          apiGetCalendarEvents(),
          apiGetAllAssignments(),
        ]);

        // Filtrer les événements du calendrier par classe si nécessaire
        const filteredEvents = classId 
          ? calendarEvents.filter(e => !e.classId || e.classId === classId)
          : calendarEvents;
        setEvents(filteredEvents);

        // Filtrer les assignements par classe si nécessaire
        const filteredAssignments = classId
          ? assignmentsData.filter(a => {
              const aClassId = typeof a.classId === "object" ? a.classId._id : a.classId;
              return aClassId === classId;
            })
          : assignmentsData;
        setAssignments(filteredAssignments);
      } catch (error) {
        console.error("Error loading calendar data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [classId]);

  const handleEventCreated = (newEvent: CalendarEvent) => {
    setEvents([...events, newEvent]);
  };

  const getEventsForDate = (date: Date): (CalendarEvent | Assignment)[] => {
    const calendarEventsForDate = events.filter((event) => {
      // Utiliser start/end si disponibles, sinon date/endDate pour compatibilité
      const eventDate = event.start ? parseISO(event.start) : parseISO(event.date);
      const eventEndDate = event.end ? parseISO(event.end) : (event.endDate ? parseISO(event.endDate) : eventDate);
      
      return isWithinInterval(date, { start: eventDate, end: eventEndDate });
    });

    const assignmentsForDate = assignments.filter((assignment) => {
      const dueDate = parseISO(assignment.dueDate);
      return isSameDay(dueDate, date);
    });

    return [...calendarEventsForDate, ...assignmentsForDate];
  };

  const filteredEvents = events.filter((event) => {
    if (filter === "devoirs") {
      return ["devoir", "tp", "projet", "exposé", "examen", "exam"].includes(event.type);
    }
    if (filter === "evenements") {
      return ["evenement", "event", "vacances", "reunion", "meeting", "holiday", "conference", "workshop", "competition", "celebration"].includes(event.type);
    }
    return true; // "all" - tout inclure
  });

  const getItemConfig = (item: CalendarEvent | Assignment) => {
    if ('type' in item && !('dueDate' in item)) {
      // C'est un CalendarEvent
      const event = item as CalendarEvent;
      return {
        title: event.title,
        date: event.start || event.date, // Utiliser start si disponible, sinon date
        config: eventTypeConfig[event.type],
        isEvent: true,
      };
    } else {
      // C'est un Assignment
      const assignment = item as Assignment;
      return {
        title: assignment.title,
        date: assignment.dueDate,
        config: eventTypeConfig[assignment.type],
        isEvent: false,
      };
    }
  };

  // Combiner les assignements avec les événements filtrés pour les événements à venir
  console.log("Events bruts:", events);
  console.log("Assignments bruts:", assignments);
  console.log("Filter:", filter);
  console.log("FilteredEvents:", filteredEvents);
  
  const combinedUpcoming: (CalendarEvent | Assignment)[] = [
    ...filteredEvents,
    ...assignments
  ]
    .map(item => ({ item, date: getItemConfig(item).date }))
    // Temporairement désactivé pour débogage
    // .filter(({ date }) => new Date(date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10)
    .map(({ item }) => item);
    
  console.log("CombinedUpcoming:", combinedUpcoming);

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Modifier les jours du calendrier pour montrer les événements
  const modifiers = {
    hasEvent: (date: Date) => getEventsForDate(date).length > 0,
    hasDevoir: (date: Date) => {
      const dateEvents = getEventsForDate(date);
      return dateEvents.some(e => {
        if ('type' in e && !('dueDate' in e)) {
          return ["devoir", "tp", "projet", "exposé"].includes((e as CalendarEvent).type);
        }
        return true; // Assignments are always considered as "devoir"
      });
    },
    hasExam: (date: Date) => getEventsForDate(date).some(e => {
      if ('type' in e && !('dueDate' in e)) {
        return (e as CalendarEvent).type === "examen";
      }
      return false;
    }),
    hasVacances: (date: Date) => getEventsForDate(date).some(e => {
      if ('type' in e && !('dueDate' in e)) {
        return (e as CalendarEvent).type === "vacances";
      }
      return false;
    }),
  };

  const modifiersStyles = {
    hasEvent: { fontWeight: "bold" },
    hasDevoir: { backgroundColor: "hsl(var(--primary) / 0.1)" },
    hasExam: { backgroundColor: "hsl(var(--destructive) / 0.1)" },
    hasVacances: { backgroundColor: "hsl(221 83% 53% / 0.1)" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendrier */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendrier scolaire
            </CardTitle>
            <CardDescription>
              Événements, devoirs et échéances
            </CardDescription>
            {userRole === "admin" && (
              <div className="mt-4">
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Créer un événement
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tout</TabsTrigger>
                <TabsTrigger value="devoirs">Devoirs</TabsTrigger>
                <TabsTrigger value="evenements">Événements</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={fr}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border"
              />
            </div>

            {/* Légende */}
            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary/20" />
                <span>Devoirs</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive/20" />
                <span>Examens</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500/20" />
                <span>Vacances</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Événements du jour sélectionné */}
        <Card className="w-full md:w-80">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, "d MMMM yyyy", { locale: fr })
                : "Sélectionnez une date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun événement ce jour
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((item) => {
                    const itemConfig = getItemConfig(item);
                    const itemId = (item as any).id || (item as any)._id;
                    return (
                      <div
                        key={itemId}
                        className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn("p-1.5 rounded", itemConfig.config.color, "text-white")}>
                            {itemConfig.config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{itemConfig.title}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {itemConfig.config.label}
                            </Badge>
                            {'description' in item && item.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Événements à venir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Prochains événements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : combinedUpcoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun événement à venir
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {combinedUpcoming.map((item) => {
                const itemConfig = getItemConfig(item);
                const itemDate = parseISO(itemConfig.date);
                const isToday = isSameDay(itemDate, new Date());
                const isTomorrow = isSameDay(itemDate, addDays(new Date(), 1));
                const itemId = (item as any).id || (item as any)._id;

                return (
                  <div
                    key={itemId}
                    className="p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", itemConfig.config.color, "text-white")}>
                        {itemConfig.config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{itemConfig.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {isToday
                            ? "Aujourd'hui"
                            : isTomorrow
                            ? "Demain"
                            : format(itemDate, "d MMM yyyy", { locale: fr })}
                        </p>
                        <Badge variant="outline" className="text-xs mt-2">
                          {itemConfig.config.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de création d'événement */}
      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un événement</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel événement au calendrier scolaire
              </DialogDescription>
            </DialogHeader>
            
            <SimpleEventForm 
              onEventCreated={(newEvent) => {
                setEvents([...events, newEvent]);
                setShowCreateDialog(false);
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

// Composant simple de création d'événement
function SimpleEventForm({ onEventCreated, onCancel }: { 
  onEventCreated: (event: CalendarEvent) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: new Date().toISOString().slice(0, 16),
    end: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    type: "event" as CalendarEvent["type"]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newEvent = await apiCreateCalendarEvent({
        title: formData.title,
        description: formData.description,
        start: formData.start,
        end: formData.end,
        type: formData.type
      });
      
      onEventCreated(newEvent);
    } catch (error) {
      console.error("Erreur création événement:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Titre</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Titre de l'événement"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as CalendarEvent["type"]})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event">Événement</SelectItem>
              <SelectItem value="exam">Examen</SelectItem>
              <SelectItem value="meeting">Réunion</SelectItem>
              <SelectItem value="holiday">Vacances</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Début</label>
          <Input
            type="datetime-local"
            value={formData.start}
            onChange={(e) => setFormData({...formData, start: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Fin</label>
          <Input
            type="datetime-local"
            value={formData.end}
            onChange={(e) => setFormData({...formData, end: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Description de l'événement"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer"}
        </Button>
      </div>
    </form>
  );
}
