/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, Clock, AlertCircle, Loader2 } from "lucide-react";
import { apiGetParentById } from "@/services/api/parents.api";
import { apiGetStudentById } from "@/services/api/students.api";
import { apiGetAttendancesByStudent } from "@/services/api/attendance.api";
import type { Student, Attendance } from "@/types";

export default function ParentAttendance() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch children
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.linkedId && !user?.id) return;
      try {
        setLoading(true);
        const parentId = user?.linkedId || user?.id;
        if(!parentId) return;

        const parentData = await apiGetParentById(parentId);
        
        let studentsData: Student[] = [];
        if (parentData.childrenIds && parentData.childrenIds.length > 0) {
           const promises = parentData.childrenIds.map(id => apiGetStudentById(id));
           const results = await Promise.all(promises);
           studentsData = results.filter((s): s is Student => !!s);
        } else if (parentData.children && parentData.children.length > 0) {
            const promises = parentData.children.map(c => apiGetStudentById(c.id));
            const results = await Promise.all(promises);
            studentsData = results.filter((s): s is Student => !!s);
        }

        setChildren(studentsData);
        if (studentsData.length > 0) {
          setSelectedChildId(studentsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching children:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, [user]);

  // Fetch attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedChildId) return;
      try {
        const data = await apiGetAttendancesByStudent(selectedChildId);
        setAttendances(data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };
    fetchAttendance();
  }, [selectedChildId]);

  const selectedChild = children.find(c => c.id === selectedChildId);

  // Statistiques
  const stats = useMemo(() => {
    return {
        present: attendances.filter(a => a.status === "present").length,
        absent: attendances.filter(a => a.status === "absent").length,
        late: attendances.filter(a => a.status === "late").length,
        excused: attendances.filter(a => a.status === "excused").length,
    };
  }, [attendances]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const attendanceRate = total > 0 ? ((stats.present + stats.excused) / total) * 100 : 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Présent</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-500">Retard</Badge>;
      case "excused":
        return <Badge className="bg-blue-500">Excusé</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  if (loading && children.length === 0) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Présences</h1>
            <p className="text-muted-foreground">Suivi des présences et absences de v{children.length > 1 ? "os enfants" : "otre enfant"}</p>
        </div>
        {children.length > 1 && (
          <div className="w-[200px]">
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un enfant" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

       {selectedChild && (
        <>
            {/* Statistiques */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                <CardContent className="pt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">{stats.present}</p>
                    <p className="text-sm text-muted-foreground">Présences</p>
                </CardContent>
                </Card>
                <Card>
                <CardContent className="pt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                    <X className="h-5 w-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-500">{stats.absent}</p>
                    <p className="text-sm text-muted-foreground">Absences</p>
                </CardContent>
                </Card>
                <Card>
                <CardContent className="pt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">{stats.late}</p>
                    <p className="text-sm text-muted-foreground">Retards</p>
                </CardContent>
                </Card>
                <Card>
                <CardContent className="pt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-500">{stats.excused}</p>
                    <p className="text-sm text-muted-foreground">Excusés</p>
                </CardContent>
                </Card>
                <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">{attendanceRate.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Taux de présence</p>
                </CardContent>
                </Card>
            </div>

            {/* Historique */}
            <Card>
                <CardHeader>
                <CardTitle>Historique des présences - {selectedChild.firstName}</CardTitle>
                <CardDescription>Liste détaillée des présences de l'année</CardDescription>
                </CardHeader>
                <CardContent>
                {attendances.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                    Aucune donnée de présence disponible
                    </p>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Cours</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Remarque</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...attendances].reverse().map((attendance) => {
                        // Need course/subject name. Assuming attendance has populated course/subject or we display "Cours"
                        // If not populated, we might just show "Cours" or fetch separately.
                        // For now avoiding complex fetches for subject names in list if not in data.
                        return (
                            <TableRow key={attendance.id}>
                            <TableCell>
                                {new Date(attendance.date).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell className="font-medium">
                                {/* Try to access course name safely if populated */}
                                {(attendance as any).course?.subject?.name || (attendance as any).courseName || "Cours"}
                            </TableCell>
                            <TableCell>{attendance.scanTime || "-"}</TableCell>
                            <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {attendance.notes || "-"}
                            </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </>
       )}
    </div>
  );
}
