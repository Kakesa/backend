/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "qrcode";
import { QrCode, Check, X, Clock, RefreshCw, Loader2 } from "lucide-react";
import { apiGetTeacherCourses } from "@/services/api/courses.api";
import { apiGetStudentsByClass } from "@/services/api/students.api";
import { apiMarkAttendance, apiCreateAttendance } from "@/services/api/attendance.api";
import type { Course, Student, Class, Subject } from "@/types";

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
  scanTime?: string;
}

export default function TeacherAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [qrData, setQrData] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.linkedId) return;
      try {
        setLoading(true);
        const data = await apiGetTeacherCourses(user.linkedId);
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching courses", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  useEffect(() => {
    const fetchStudents = async () => {
      const currentCourse = courses.find(c => c.id === selectedCourseId);
      if (!currentCourse) return;
      
      const classId = typeof currentCourse.classId === 'object' ? currentCourse.classId._id : currentCourse.classId;
      if (!classId) return;

      try {
        const data = await apiGetStudentsByClass(classId);
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students", error);
      }
    };
    fetchStudents();
  }, [selectedCourseId, courses]);

  const currentCourse = courses.find(c => c.id === selectedCourseId);
  const currentClass = currentCourse ? (currentCourse.classId as any) : null;
  const currentSubject = currentCourse ? (currentCourse.subjectId as any) : null;

  const generateNewQRCode = useCallback(async () => {
    if (!selectedCourseId) return;
    
    const data = JSON.stringify({
      courseId: selectedCourseId,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      teacherId: user?.linkedId,
    });
    
    try {
      const qrCodeImage = await QRCode.toDataURL(data, { width: 200, margin: 2 });
      setQrCode(qrCodeImage);
      setQrData(data);
      toast({
        title: "QR Code généré",
        description: "Le QR code est valide pour cet appel.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le QR code.",
        variant: "destructive",
      });
    }
  }, [selectedCourseId, user?.linkedId, toast]);

  const markAttendance = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        scanTime: status !== "absent" ? new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : undefined,
      },
    }));
  };

  const saveAttendance = async () => {
    const records = Object.values(attendanceRecords);
    if (records.length === 0) return;

    try {
      setSaving(true);
      await Promise.all(records.map(record => 
        apiMarkAttendance(
          record.studentId,
          selectedCourseId,
          record.status,
          record.scanTime
        )
      ));

      toast({
        title: "Appel enregistré",
        description: `${records.filter(r => r.status === "present").length} présents, ${records.filter(r => r.status === "absent").length} absents, ${records.filter(r => r.status === "late").length} retards.`,
      });
    } catch (error) {
      console.error("Error saving attendance", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'appel.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status?: "present" | "absent" | "late") => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Présent</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-500">Retard</Badge>;
      default:
        return <Badge variant="outline">Non marqué</Badge>;
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      generateNewQRCode();
    }
  }, [selectedCourseId, generateNewQRCode]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appel QR Code</h1>
        <p className="text-muted-foreground">Faites l'appel de vos élèves avec le QR code</p>
      </div>

      {/* Sélection du cours */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un cours</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Choisir un cours" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => {
                const subject = course.subjectId as any;
                const cls = course.classId as any;
                const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                return (
                  <SelectItem key={course.id} value={course.id}>
                    {subject?.name} - {cls?.name} ({days[course.dayOfWeek]} {course.startTime})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code d'Appel
            </CardTitle>
            <CardDescription>
              {currentSubject?.name} - {currentClass?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {qrCode ? (
              <>
                <img src={qrCode} alt="QR Code" className="h-48 w-48 rounded-lg border" />
                <p className="text-sm text-muted-foreground">
                  Date: {new Date().toLocaleDateString("fr-FR")}
                </p>
                <Button variant="outline" onClick={generateNewQRCode}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regénérer le QR Code
                </Button>
              </>
            ) : (
              <div className="h-48 w-48 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Sélectionnez un cours</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appel manuel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Appel Manuel</CardTitle>
              <CardDescription>Marquez les présences manuellement</CardDescription>
            </div>
            <Button onClick={saveAttendance} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer l'appel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-muted-foreground">Chargement des élèves...</p>
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Aucun élève trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => {
                      const record = attendanceRecords[student.id];
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.lastName} {student.firstName}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(record?.status)}
                            {record?.scanTime && (
                              <span className="ml-2 text-xs text-muted-foreground">{record.scanTime}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant={record?.status === "present" ? "default" : "outline"}
                                className="h-7 w-7"
                                onClick={() => markAttendance(student.id, "present")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant={record?.status === "late" ? "default" : "outline"}
                                className="h-7 w-7"
                                onClick={() => markAttendance(student.id, "late")}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant={record?.status === "absent" ? "destructive" : "outline"}
                                className="h-7 w-7"
                                onClick={() => markAttendance(student.id, "absent")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
