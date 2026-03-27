/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllTeachers } from "@/services/api/teachers.api";
import { apiGetStudentsByClass } from "@/services/api/students.api";
import { getCurrentSchoolId } from "@/services/api/client";
import type { Class, Teacher, Student } from "@/types";

export default function TeacherClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classesData, teachersData] = await Promise.all([
        apiGetAllClasses(),
        apiGetAllTeachers()
      ]);

      setClasses(classesData);
      setTeachers(teachersData);

      // Trouver le professeur actuel
      const teacher = teachersData.find(t => t.id === user?.linkedId);
      setCurrentTeacher(teacher || null);

      // Filtrer les classes du professeur
      // Un professeur peut être lié à une classe via teacher.classes OU via class.mainTeacherId
      if (user?.linkedId) {
        const teacherClasses = classesData.filter(c => {
          const isMainTeacher = typeof c.mainTeacherId === 'string'
            ? c.mainTeacherId === user.linkedId
            : (c.mainTeacherId as any)?.id === user.linkedId || (c.mainTeacherId as any)?._id === user.linkedId;

          const isInTeacherClasses = teacher?.classes?.includes(c.id);

          return isMainTeacher || isInTeacherClasses;
        });

        if (teacherClasses.length > 0 && !selectedClassId) {
          setSelectedClassId(teacherClasses[0].id);
        }
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.linkedId, selectedClassId]);

  const loadStudents = useCallback(async (classId: string) => {
    if (!classId) return;

    setLoadingStudents(true);
    try {
      const studentsData = await apiGetStudentsByClass(classId);
      // Backend already includes paymentStatus if requested (default for teacher role)
      setStudents(studentsData);
    } catch (error) {
      toast.error("Erreur lors du chargement des élèves");
      console.error(error);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId, loadStudents]);

  const teacherClasses = user?.linkedId
    ? classes.filter(cls => {
      const classId = cls.id || cls._id;
      const mainTeacherId = typeof cls.mainTeacherId === 'string'
        ? cls.mainTeacherId
        : (cls.mainTeacherId as any)?.id || (cls.mainTeacherId as any)?._id;

      const isMainTeacher = mainTeacherId === user.linkedId;

      const profileClassIds = (currentTeacher?.classes || []).map((pc: any) => typeof pc === 'string' ? pc : (pc.id || pc._id));
      const isInTeacherClasses = profileClassIds.includes(classId);

      return isMainTeacher || isInTeacherClasses;
    })
    : [];

  const currentClass = classes.find(c => c.id === selectedClassId);


  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (teacherClasses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes Classes</h1>
          <p className="text-muted-foreground">Gérez vos classes et consultez la liste des élèves</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune classe assignée</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas encore de classes assignées. Contactez l'administration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes Classes</h1>
          <p className="text-muted-foreground">Gérez vos classes et consultez la liste des élèves</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Sélection de classe */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une classe</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Choisir une classe" />
            </SelectTrigger>
            <SelectContent>
              {teacherClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount || 0} élèves)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Infos classe */}
      {currentClass && (
        <Card>
          <CardHeader>
            <CardTitle>{currentClass.name}</CardTitle>
            <CardDescription>
              {currentClass.level} - Section {currentClass.section} | Année scolaire: {currentClass.academicYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Élèves inscrits</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{students.filter(s => s.gender === "FEMALE").length}</p>
                <p className="text-sm text-muted-foreground">Filles</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{students.filter(s => s.gender === "MALE").length}</p>
                <p className="text-sm text-muted-foreground">Garçons</p>
              </div>
            </div>

            {/* Liste des élèves */}
            {loadingStudents ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun élève inscrit dans cette classe
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom et Prénom</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono">{student.matricule}</TableCell>
                      <TableCell className="font-medium">{student.lastName} {student.firstName}</TableCell>
                      <TableCell>
                        <Badge variant={student.gender === "FEMALE" ? "secondary" : "outline"}>
                          {student.gender === "FEMALE" ? "Féminin" : "Masculin"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {typeof student.paymentStatus === 'object' && student.paymentStatus?.status === "PAID" ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> En règle
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
                            <AlertCircle className="w-3 h-3 mr-1" /> Non en règle ({typeof student.paymentStatus === 'object' ? student.paymentStatus?.unpaidCount : 0})
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status?.toLowerCase() === "active" ? "default" : "destructive"}>
                          {student.status || "ACTIF"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
