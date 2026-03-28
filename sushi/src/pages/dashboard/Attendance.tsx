/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, X, Clock, Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetStudentsByClass } from "@/services/api/students.api";
import { apiGetAllAttendances, apiCreateAttendance } from "@/services/api/attendance.api";
import { apiGetAllCourses } from "@/services/api/courses.api";
import { Class, Student, Attendance as AttendanceType, Course } from "@/types";

export default function Attendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const classesData = await apiGetAllClasses();
      setClasses(classesData);
      if (classesData.length > 0) {
        setSelectedClassId(classesData[0].id);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
      toast.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load students and courses for the selected class
  useEffect(() => {
    if (!selectedClassId) return;

    const loadClassData = async () => {
      try {
        setLoading(true);
        const [studentsData, coursesData] = await Promise.all([
          apiGetStudentsByClass(selectedClassId),
          apiGetAllCourses({ classId: selectedClassId }),
        ]);
        setStudents(studentsData);
        setCourses(coursesData);
        
        if (coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].id);
        } else {
          setSelectedCourseId("");
        }
      } catch (err) {
        console.error("Failed to load class data:", err);
        toast.error("Erreur lors du chargement des élèves");
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [selectedClassId]);

  // Load existing attendance records
  useEffect(() => {
    if (!selectedClassId || !selectedCourseId || !date) return;

    const loadAttendance = async () => {
      try {
        const dateStr = format(date, "yyyy-MM-dd");
        const existing = await apiGetAllAttendances({
          date: dateStr,
          courseId: selectedCourseId,
        });
        
        const records: Record<string, string> = {};
        existing.forEach(rec => {
          records[rec.studentId] = rec.status;
        });
        
        // Initialize records for students who don't have one — leave empty (non marqué) by default
        // Only students with an explicit status will be persisted when saving
        setAttendanceRecords(records);
      } catch (err) {
        console.error("Failed to load attendance records:", err);
      }
    };

    loadAttendance();
  }, [selectedClassId, selectedCourseId, date]);

  const stats = {
    total: students.length,
    present: students.filter((s) => attendanceRecords[s.id] === "present").length,
    absent: students.filter((s) => attendanceRecords[s.id] === "absent").length,
    late: students.filter((s) => attendanceRecords[s.id] === "late").length,
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const handleSave = async () => {
    if (!selectedCourseId) {
      toast.error("Veuillez sélectionner un cours");
      return;
    }

    try {
      setSaving(true);
      const dateStr = format(date, "yyyy-MM-dd");
      
      const studentsToSave = students.filter(student => attendanceRecords[student.id]);
      if (studentsToSave.length === 0) {
        toast.error("Aucun statut modifié à enregistrer");
        return;
      }

      const promises = studentsToSave.map(student => {
        const status = attendanceRecords[student.id] as any;
        return apiCreateAttendance({
          studentId: student.id,
          courseId: selectedCourseId,
          date: dateStr,
          status,
          scanTime: status === "present" ? format(new Date(), "HH:mm") : undefined,
          notes: ""
        });
      });

      await Promise.all(promises);
      toast.success(`Présences enregistrées pour le ${format(date, "dd MMMM yyyy", { locale: fr })}.`);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast.error("Erreur lors de l'enregistrement des présences");
    } finally {
      setSaving(false);
    }
  };

  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Suivi des Présences</h1>
        <p className="text-muted-foreground">Gérez l'assiduité des élèves</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Classe</label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Cours / Matière</label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sélectionner un cours" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {typeof course.subjectId === "object" ? course.subjectId.name : course.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Effectif total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Présents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feuille de présence - {selectedClassName}</CardTitle>
              <CardDescription>
                {format(date, "EEEE dd MMMM yyyy", { locale: fr })}
              </CardDescription>
            </div>
            <Button 
                onClick={handleSave} 
                disabled={saving || students.length === 0}
                className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <p>Aucun élève trouvé dans cette classe.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => {
                    const status = attendanceRecords[student.id] || "";
                    return (
                        <TableRow key={student.id}>
                        <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                            <Badge
                            variant={
                                status === "present"
                                ? "default"
                                : status === "absent"
                                ? "destructive"
                                : status === "late"
                                ? "secondary"
                                : "outline"
                            }
                            >
                            {status === "present"
                                ? "Présent"
                                : status === "absent"
                                ? "Absent"
                                : status === "late"
                                ? "Retard"
                                : "Non marqué"}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant={status === "present" ? "default" : "outline"}
                                onClick={() => handleStatusChange(student.id, "present")}
                                className="h-8 w-8 p-0"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={status === "absent" ? "destructive" : "outline"}
                                onClick={() => handleStatusChange(student.id, "absent")}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={status === "late" ? "secondary" : "outline"}
                                onClick={() => handleStatusChange(student.id, "late")}
                                className="h-8 w-8 p-0"
                            >
                                <Clock className="h-4 w-4" />
                            </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
