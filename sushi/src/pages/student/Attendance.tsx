/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, FileQuestion, Calendar, Loader2 } from "lucide-react";
import { apiGetAttendancesByStudent, apiGetAttendanceStats } from "@/services/api/attendance.api";
import { useAuth } from "@/contexts/AuthContext";
import type { Attendance } from "@/types";
export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.linkedId) return;
      try {
        setLoading(true);
        const [data, statsData] = await Promise.all([
          apiGetAttendancesByStudent(user.linkedId),
          apiGetAttendanceStats(user.linkedId)
        ]);
        setAttendances(data);
        setStats(statsData);
      } catch (error) {
        console.error("Error loading attendance data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const getCourseInfo = (attendance: any) => {
    const course = attendance.courseId;
    if (!course || typeof course === 'string') return { subject: attendance.subjectName || "N/A", room: "N/A" };
    const subject = course.subjectId;
    return { 
      subject: (typeof subject === 'object' ? subject.name : (attendance.subjectName || "N/A")), 
      room: course.room || "N/A" 
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Présent</Badge>;
      case "absent":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Retard</Badge>;
      case "excused":
        return <Badge className="bg-blue-500"><FileQuestion className="h-3 w-3 mr-1" />Justifié</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredAttendances = filter === "all" 
    ? attendances 
    : attendances.filter(a => a.status === filter);

  const total = stats.present + stats.absent + stats.late + stats.excused;
  const attendanceRate = total > 0 ? ((stats.present + stats.excused) / total) * 100 : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historique de Présence</h1>
        <p className="text-muted-foreground">Consultez votre historique de présences et absences</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Taux de présence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Présences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Retards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <FileQuestion className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                <p className="text-sm text-muted-foreground">Justifiées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Détail des Présences</CardTitle>
              <CardDescription>Historique complet de vos présences</CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="present">Présent</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Retard</SelectItem>
                <SelectItem value="excused">Justifié</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Cours</TableHead>
                <TableHead>Salle</TableHead>
                <TableHead>Heure de scan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Chargement des présences...</p>
                  </TableCell>
                </TableRow>
              ) : filteredAttendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun enregistrement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendances.map((attendance) => {
                  const courseInfo = getCourseInfo(attendance);
                  return (
                    <TableRow key={attendance.id || `attendance-${attendance.date}-${attendance.courseId}`}>
                      <TableCell>{new Date(attendance.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-medium">{courseInfo.subject}</TableCell>
                      <TableCell>{courseInfo.room}</TableCell>
                      <TableCell>{attendance.scanTime || "-"}</TableCell>
                      <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{attendance.notes || "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
