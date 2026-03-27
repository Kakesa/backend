/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, CalendarIcon } from "lucide-react";
import { apiCreateCalendarEvent } from "@/services/api/calendar.api";
import type { CalendarEvent } from "@/services/api/calendar.api";

const createEventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  start: z.string().min(1, "La date de début est requise"),
  end: z.string().min(1, "La date de fin est requise"),
  type: z.enum(["event", "exam", "meeting", "holiday", "conference", "workshop", "competition", "celebration", "devoir", "examen", "evenement", "vacances", "reunion", "tp", "projet", "exposé"]),
  classId: z.string().optional(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

interface AdminEventCreationProps {
  onEventCreated?: (event: CalendarEvent) => void;
  onCancel?: () => void;
}

export function AdminEventCreation({ onEventCreated, onCancel }: AdminEventCreationProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      start: new Date().toISOString().slice(0, 16), // Format datetime-local
      end: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // +1 heure
      type: "event",
      classId: "",
    },
  });

  const onSubmit = async (data: CreateEventForm) => {
    setLoading(true);
    try {
      const eventData = {
        title: data.title,
        description: data.description,
        start: data.start,
        end: data.end,
        type: data.type as any,
        classId: data.classId || undefined,
      };

      const createdEvent = await apiCreateCalendarEvent(eventData);
      toast({
        title: "Événement créé",
        description: `"${data.title}" a été ajouté au calendrier.`,
      });

      form.reset();
      setOpen(false);
      onEventCreated?.(createdEvent);
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Créer un événement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Créer un nouvel événement
          </DialogTitle>
          <DialogDescription>
            Ajoutez un événement au calendrier scolaire accessible à tous
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            {/* Titre */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de l'événement</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Réunion parents-professeurs"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date et heure de début */}
            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date et heure de début</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date et heure de fin */}
            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date et heure de fin</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'événement</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="event">Événement</SelectItem>
                      <SelectItem value="conference">Conférence</SelectItem>
                      <SelectItem value="workshop">Atelier</SelectItem>
                      <SelectItem value="competition">Compétition</SelectItem>
                      <SelectItem value="celebration">Célébration</SelectItem>
                      <SelectItem value="meeting">Réunion</SelectItem>
                      <SelectItem value="exam">Examen</SelectItem>
                      <SelectItem value="holiday">Vacances</SelectItem>
                      <SelectItem value="devoir">Devoir</SelectItem>
                      <SelectItem value="tp">TP</SelectItem>
                      <SelectItem value="projet">Projet</SelectItem>
                      <SelectItem value="exposé">Exposé</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajoutez des détails sur cet événement..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel?.();
                setOpen(false);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer l'événement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
