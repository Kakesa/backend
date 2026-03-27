/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Trash2,
  GripVertical,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { 
  apiGetAllScheduleSlots, 
  apiGetScheduleByClass, 
  apiCreateScheduleSlot, 
  apiUpdateScheduleSlot, 
  apiDeleteScheduleSlot,
  apiCheckScheduleConflicts,
  apiGetAllRooms
} from "@/services/api/schedule.api";
import { apiGetAllTeachers } from "@/services/api/teachers.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import { days, timeSlots, subjectColors } from "@/data/scheduleData";
import { Class, Teacher, Subject, Room, ScheduleSlot, ConflictResult } from "@/types";

export default function ScheduleManagement() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [conflictAlert, setConflictAlert] = useState<ConflictResult | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    subjectId: "",
    teacherId: "",
    dayOfWeek: 1,
    startTime: "",
    endTime: "",
    roomId: "",
  });

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [classesData, teachersData, subjectsData, roomsData] = await Promise.all([
        apiGetAllClasses(),
        apiGetAllTeachers(),
        apiGetAllSubjects(),
        apiGetAllRooms()
      ]);
      
      setClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setRooms(roomsData);
      
      if (classesData.length > 0) {
        setSelectedClass(classesData[0].id || (classesData[0] as any)._id);
      }
    } catch (err) {
      console.error("Failed to load initial schedule data:", err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const data = await apiGetScheduleByClass(selectedClass);
      setSchedule(data);
    } catch (err) {
      console.error("Failed to load schedule:", err);
      toast.error("Erreur lors du chargement de l'emploi du temps");
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedClass) {
      loadSchedule();
    }
  }, [selectedClass, loadSchedule]);

  const handleDragStart = (e: React.DragEvent, slot: ScheduleSlot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dayOfWeek: number, timeSlot: typeof timeSlots[0]) => {
    e.preventDefault();
    if (!draggedSlot) return;

    const updates = {
      dayOfWeek,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    };

    try {
      setLoading(true);
      const result = await apiUpdateScheduleSlot(draggedSlot.id, updates);
      
      if (result && "hasConflict" in result && result.hasConflict) {
        setConflictAlert(result);
        return;
      }

      await loadSchedule();
      toast.success("Cours déplacé");
    } catch (err) {
      console.error("Failed to move slot:", err);
      toast.error("Erreur lors du déplacement du cours");
    } finally {
      setLoading(false);
      setDraggedSlot(null);
    }
  };

  const handleAddSlot = async () => {
    const subject = subjects.find((s) => s.id === formData.subjectId || (s as any)._id === formData.subjectId);
    const teacher = teachers.find((t) => t.id === formData.teacherId || (t as any)._id === formData.teacherId);
    const room = rooms.find(r => r.id === formData.roomId || (r as any)._id === formData.roomId);
    const selectedClassData = classes.find((c) => c.id === selectedClass || (c as any)._id === selectedClass);

    if (!subject || !teacher || !selectedClassData || !room) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const newSlot: any = {
      courseId: `crs-${Date.now()}`,
      subjectId: formData.subjectId,
      subjectName: subject.name,
      teacherId: formData.teacherId,
      teacherName: `${teacher.firstName[0]}. ${teacher.lastName}`,
      classId: selectedClass,
      className: selectedClassData.name,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: room.name,
      color: subjectColors[formData.subjectId] || "bg-gray-500",
    };

    try {
      setLoading(true);
      const result = await apiCreateScheduleSlot(newSlot);

      if ("hasConflict" in result && result.hasConflict) {
        setConflictAlert(result);
        return;
      }

      await loadSchedule();
      setIsDialogOpen(false);
      setFormData({
        subjectId: "",
        teacherId: "",
        dayOfWeek: 1,
        startTime: "",
        endTime: "",
        roomId: "",
      });

      toast.success("Cours ajouté à l'emploi du temps");
    } catch (err) {
      console.error("Failed to add slot:", err);
      toast.error("Erreur lors de l'ajout du cours");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteSlotId) return;
    
    try {
      setLoading(true);
      await apiDeleteScheduleSlot(deleteSlotId);
      await loadSchedule();
      toast.success("Cours supprimé");
    } catch (err) {
      console.error("Failed to delete slot:", err);
      toast.error("Erreur lors de la suppression du cours");
    } finally {
      setLoading(false);
      setDeleteSlotId(null);
    }
  };

  const getSlotForTimeAndDay = (dayId: number, timeSlot: typeof timeSlots[0]) => {
    return schedule.find(
      (slot) =>
        slot.dayOfWeek === dayId &&
        slot.startTime <= timeSlot.startTime &&
        slot.endTime >= timeSlot.endTime
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Emplois du Temps</h1>
          <p className="text-muted-foreground">Créez et gérez les emplois du temps avec drag-and-drop</p>
        </div>
        <div className="flex gap-2 items-center">
          {loading && <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un cours
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un cours à l'emploi du temps</DialogTitle>
                <DialogDescription>
                  Le système vérifie automatiquement les conflits
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Matière</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(v) => setFormData({ ...formData, subjectId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id || (s as any)._id} value={s.id || (s as any)._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Professeur</Label>
                  <Select
                    value={formData.teacherId}
                    onValueChange={(v) => setFormData({ ...formData, teacherId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un professeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id || (t as any)._id} value={t.id || (t as any)._id}>
                          {t.firstName} {t.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jour</Label>
                    <Select
                      value={formData.dayOfWeek.toString()}
                      onValueChange={(v) => setFormData({ ...formData, dayOfWeek: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Salle</Label>
                    <Select
                      value={formData.roomId}
                      onValueChange={(v) => setFormData({ ...formData, roomId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Salle" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.id || (r as any)._id} value={r.id || (r as any)._id}>
                            {r.name} ({r.capacity} places)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure début</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure fin</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddSlot}>Ajouter</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Conflict Alert */}
      <AlertDialog open={!!conflictAlert} onOpenChange={() => setConflictAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Conflit détecté
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conflictAlert?.message}
              {conflictAlert?.conflictingSlot && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Cours en conflit:</strong> {conflictAlert.conflictingSlot.subjectName}
                  <br />
                  <strong>Horaire:</strong> {conflictAlert.conflictingSlot.startTime} - {conflictAlert.conflictingSlot.endTime}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConflictAlert(null)}>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSlotId} onOpenChange={() => setDeleteSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le cours sera supprimé de l'emploi du temps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSlot} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Emploi du temps - {classes.find((c) => (c.id || (c as any)._id) === selectedClass)?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted w-24 text-foreground">Horaire</th>
                  {days.map((day) => (
                    <th key={day.id} className="border p-2 bg-muted text-foreground">
                      {day.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot) => (
                  <tr key={timeSlot.startTime}>
                    <td className="border p-2 text-center text-sm font-medium bg-muted/50 text-foreground">
                      {timeSlot.label}
                    </td>
                    {days.map((day) => {
                      const slot = getSlotForTimeAndDay(day.id, timeSlot);
                      return (
                        <td
                          key={day.id}
                          className="border p-1 h-20 align-top relative"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day.id, timeSlot)}
                        >
                          {slot && slot.startTime === timeSlot.startTime && (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, slot)}
                              className={`${slot.color} text-white p-2 rounded-md text-xs cursor-move hover:opacity-90 transition-opacity group relative`}
                            >
                              <div className="flex items-start justify-between">
                                <GripVertical className="h-3 w-3 opacity-50" />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteSlotId(slot.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="font-semibold mt-1">{slot.subjectName}</p>
                              <div className="flex items-center gap-1 mt-1 opacity-80">
                                <User className="h-3 w-3" />
                                <span>{slot.teacherName}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-80">
                                <MapPin className="h-3 w-3" />
                                <span>{slot.room}</span>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground">Légende:</span>
            {subjects.slice(0, 8).map((subject) => (
              <Badge
                key={subject.id || (subject as any)._id}
                className={`${subjectColors[subject.id || (subject as any)._id] || "bg-gray-500"} text-white border-0`}
              >
                {subject.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
