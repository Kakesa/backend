/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Calendar, MapPin, Loader2 } from "lucide-react";
import { apiGetParentById } from "@/services/api/parents.api";
import { apiGetStudentById } from "@/services/api/students.api";
import { apiGetClassById } from "@/services/api/classes.api";
import type { Student, Class } from "@/types";

export default function ParentChildren() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [studentsInfo, setStudentsInfo] = useState<Record<string, {student: Student, cls: Class | null}>>({});

  const fetchData = useCallback(async () => {
    if (!user?.linkedId) return;
    try {
      setLoading(true);
      const parent = await apiGetParentById(user.linkedId);
      if (parent.children) {
        setChildrenData(parent.children);
        
        const info: Record<string, {student: Student, cls: Class | null}> = {};
        await Promise.all(parent.children.map(async (c: any) => {
          try {
            const student = await apiGetStudentById(c.id);
            if (student) {
              // Le backend populate déjà "class" avec name, section, academicYear
              const studentClass = (student as any).class;
              let cls: Class | null = null;

              if (studentClass && typeof studentClass === 'object' && studentClass.name) {
                // L'objet class est déjà populé par le backend
                cls = {
                  ...studentClass,
                  id: studentClass._id || studentClass.id,
                } as Class;
              } else {
                // Fallback: classId est un string, on fetch séparément
                const classId = studentClass || (student as any).classId;
                if (classId && typeof classId === 'string') {
                  cls = await apiGetClassById(classId) || null;
                }
              }

              info[c.id] = { student, cls };
            }
          } catch (e) {
            console.error(`Error fetching student ${c.id}:`, e);
          }
        }));
        setStudentsInfo(info);
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les informations des enfants.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  if (childrenData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Aucun enfant associé à ce compte</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes Enfants ({childrenData.length})</h1>
        <p className="text-muted-foreground">Informations sur vos enfants scolarisés</p>
      </div>

      {childrenData.map(childRef => {
        const info = studentsInfo[childRef.id];
        if (!info) return null;
        const { student, cls } = info;
        
        return (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>{student.lastName} {student.firstName}</CardTitle>
                  <CardDescription>Matricule: {student.matricule}</CardDescription>
                </div>
                <Badge className="ml-auto" variant={student.status?.toUpperCase() === "ACTIVE" ? "default" : "destructive"}>
                  {student.status?.toUpperCase() === "ACTIVE" ? "Inscrit" : "Inactif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informations personnelles</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Date de naissance: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("fr-FR") : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Genre: {student.gender === "MALE" ? "Masculin" : student.gender === "FEMALE" ? "Féminin" : "Autre"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Adresse: {student.address || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Téléphone: {student.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email: {student.email || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informations scolaires</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Classe</p>
                      <p className="font-semibold text-lg">{cls?.name || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls?.level} - Section {cls?.section}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Année scolaire</p>
                      <p className="font-semibold">{cls?.academicYear || "N/A"}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Date d'inscription</p>
                      <p className="font-semibold">
                        {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString("fr-FR") : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
