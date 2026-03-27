/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Clock, MapPin, GraduationCap, X, AlertTriangle } from "lucide-react";
import { apiGetMySchedule, apiCreateScheduleSlot, apiDeleteScheduleSlot, apiGetAllRooms } from "@/services/api/schedule.api";
import { apiGetTeacherCourses } from "@/services/api/courses.api";
import { Course, Room, ScheduleSlot, ConflictResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const workDays = [
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
];
const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const formSchema = z.object({
  courseId: z.string().min(1, "Veuillez choisir un cours"),
  dayOfWeek: z.string().min(1, "Veuillez choisir un jour"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:mm requis"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:mm requis"),
  roomId: z.string().optional(),
}).refine((data) => {
  const start = parseInt(data.startTime.replace(":", ""));
  const end = parseInt(data.endTime.replace(":", ""));
  return end > start;
}, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ["endTime"],
});

type FormValues = z.infer<typeof formSchema>;

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: "",
      dayOfWeek: "1",
      startTime: "08:00",
      endTime: "10:00",
      roomId: "",
    },
  });

  const loadData = useCallback(async () => {
    if (!user?.linkedId) return;
    try {
      setLoading(true);
      const [scheduleData, coursesData, roomsData] = await Promise.all([
        apiGetMySchedule(),
        apiGetTeacherCourses(user.linkedId),
        apiGetAllRooms(),
      ]);
      setSchedule(scheduleData);
      setTeacherCourses(coursesData);
      setRooms(roomsData);
    } catch (err) {
      console.error("Failed to load schedule data:", err);
      toast.error("Erreur lors du chargement de l'emploi du temps");
    } finally {
      setLoading(false);
    }
  }, [user?.linkedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const selectedCourse = teacherCourses.find(c => c.id === values.courseId);
      if (!selectedCourse || !user?.linkedId || !user?.firstName) return;

      const subjectName = typeof selectedCourse.subjectId === 'object' ? (selectedCourse.subjectId as any).name : "Matière";
      const className = typeof selectedCourse.classId === 'object' ? (selectedCourse.classId as any).name : "Classe";
      const subjectId = typeof selectedCourse.subjectId === 'object' ? (selectedCourse.subjectId as any)._id || (selectedCourse.subjectId as any).id : selectedCourse.subjectId;
      const classId = typeof selectedCourse.classId === 'object' ? (selectedCourse.classId as any)._id || (selectedCourse.classId as any).id : selectedCourse.classId;

      const payload = {
        courseId: values.courseId,
        subjectId: subjectId,
        subjectName: subjectName,
        teacherId: user.linkedId,
        teacherName: `${user.firstName} ${user.lastName || ""}`,
        classId: classId,
        className: className,
        dayOfWeek: parseInt(values.dayOfWeek),
        startTime: values.startTime,
        endTime: values.endTime,
        room: (values.roomId && values.roomId !== "none") 
          ? (rooms.find(r => r.id === values.roomId)?.name || "") 
          : "",
        color: "#3b82f6" // Default blue
      };

      const result = await apiCreateScheduleSlot(payload as any);
      
      if ((result as any).hasConflict) {
        setConflict(result as ConflictResult);
        return;
      }

      toast.success("Créneau ajouté avec succès");
      setDialogOpen(false);
      loadData();
      form.reset();
    } catch (err: any) {
      console.error("Failed to create schedule slot:", err);
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout du créneau");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiDeleteScheduleSlot(deleteId);
      toast.success("Créneau supprimé");
      setSchedule(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete slot:", err);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getCourseAt = (dayIndex: number, hour: string) => {
    return schedule.find(item => {
      if (item.dayOfWeek !== dayIndex) return false;
      const startHour = parseInt(item.startTime.split(":")[0]);
      const endHour = parseInt(item.endTime.split(":")[0]);
      const currentHour = parseInt(hour.split(":")[0]);
      return currentHour >= startHour && currentHour < endHour;
    });
  };

  const isFirstHour = (dayIndex: number, hour: string, item: ScheduleSlot) => {
    return item.startTime.startsWith(hour.split(":")[0]);
  };

  const getRowSpan = (item: ScheduleSlot) => {
    const startHour = parseInt(item.startTime.split(":")[0]);
    const endHour = parseInt(item.endTime.split(":")[0]);
    const endMin = parseInt(item.endTime.split(":")[1]);
    let span = endHour - startHour;
    if (endMin > 0) span += 1; // Basic handling for non-hourly endings
    return span || 1;
  };

  // Robust display helpers
  const getDisplaySubject = (item: ScheduleSlot) => {
    return item.subjectName || (item as any).courseId?.subjectId?.name || (item as any).subjectId?.name || "Matière";
  };

  const getDisplayClass = (item: ScheduleSlot) => {
    return item.className || (item as any).courseId?.classId?.name || (item as any).classId?.name || "Classe";
  };

  const getDisplayRoom = (item: ScheduleSlot) => {
    return item.room || (item as any).roomId?.name || "";
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mon Emploi du Temps</h1>
          <p className="text-muted-foreground">Gérez vos jours et heures de cours</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un créneau
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouveau créneau</DialogTitle>
              <DialogDescription>
                Définissez un nouveau moment de cours. Les conflits seront vérifiés.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cours / Classe</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un cours" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teacherCourses.map((course) => {
                            const subjectName = typeof course.subjectId === 'object' ? (course.subjectId as any).name : "Cours";
                            const className = typeof course.classId === 'object' ? (course.classId as any).name : "Classe";
                            return (
                              <SelectItem key={course.id} value={course.id}>
                                {subjectName} - {className}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jour</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Jour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workDays.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Salle (Optionnel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure Début</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure Fin</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semaine en cours</CardTitle>
          <CardDescription>Visualisation de votre planning hebdomadaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted min-w-[80px]">Heure</th>
                  {days.slice(1, 7).map((day) => (
                    <th key={day} className="border p-2 bg-muted min-w-[150px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour}>
                    <td className="border p-2 text-center font-medium bg-muted/50">{hour}</td>
                    {days.slice(1, 7).map((_, dayIndex) => {
                      const actualDayIndex = dayIndex + 1;
                      const item = getCourseAt(actualDayIndex, hour);
                      
                      if (item && !isFirstHour(actualDayIndex, hour, item)) {
                        return null;
                      }
                      
                      if (item && isFirstHour(actualDayIndex, hour, item)) {
                        const rowSpan = getRowSpan(item);
                        
                        return (
                          <td
                            key={`${actualDayIndex}-${hour}`}
                            rowSpan={rowSpan}
                            className="border p-2 bg-primary/10 relative group align-top"
                          >
                            <div className="text-sm">
                              <p className="font-semibold text-primary">{getDisplaySubject(item)}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <GraduationCap className="h-3 w-3" />
                                {getDisplayClass(item)}
                              </div>
                              {getDisplayRoom(item) && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {getDisplayRoom(item)}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs font-medium mt-1">
                                <Clock className="h-3 w-3" />
                                {item.startTime} - {item.endTime}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        );
                      }
                      
                      return <td key={`${actualDayIndex}-${hour}`} className="border p-2 h-16"></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Liste détaillée pour mobile */}
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle>Liste des cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedule.sort((a,b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map((item) => (
              <div key={item.id} className="p-4 rounded-lg bg-muted flex justify-between items-start">
                <div className="space-y-1">
                  <Badge variant="outline">{days[item.dayOfWeek]}</Badge>
                  <p className="font-bold">{getDisplaySubject(item)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> {getDisplayClass(item)}
                  </p>
                  <p className="text-xs font-medium text-primary flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {item.startTime} - {item.endTime}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {schedule.length === 0 && <p className="text-center text-muted-foreground italic">Aucun cours programmé.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Dialog */}
      <AlertDialog open={!!conflict} onOpenChange={() => setConflict(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Conflit de planning
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conflict?.message || "Un conflit a été détecté avec un autre cours."}
              {conflict?.conflictingSlot && (
                <div className="mt-3 p-3 bg-muted rounded-md text-sm border-l-4 border-destructive">
                  <p className="font-semibold text-foreground">{getDisplaySubject(conflict.conflictingSlot)}</p>
                  <p>{getDisplayClass(conflict.conflictingSlot)}</p>
                  <p className="text-xs mt-1">{conflict.conflictingSlot.startTime} - {conflict.conflictingSlot.endTime}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce créneau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retirera définitivement ce cours de votre emploi du temps hebdomadaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
