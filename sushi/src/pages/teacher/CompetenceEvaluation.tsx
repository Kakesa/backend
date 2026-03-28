/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Target, TrendingUp, Award, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// API Services
import { apiGetTeacherCourses } from "@/services/api/courses.api";
import { apiGetStudentsByClass } from "@/services/api/students.api";
import { 
  apiGetCompetencesBySubject, 
  apiGetCompetenceProgress, 
  apiCreateEvaluation 
} from "@/services/api/competences.api";
import type { 
  Competence, 
  Student, 
  Course, 
  StudentCompetenceEvaluation,
  CompetenceProgress,
  AcquisitionLevel
} from "@/types";

export default function CompetenceEvaluation() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for data
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [competencesList, setCompetencesList] = useState<Competence[]>([]);
  const [studentProgress, setStudentProgress] = useState<Record<string, Record<string, CompetenceProgress>>>({});
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTrimester, setSelectedTrimester] = useState<"1" | "2" | "3">("1");
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isEvalDialogOpen, setIsEvalDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedCompetence, setSelectedCompetence] = useState<Competence | null>(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("");
  const [evalNotes, setEvalNotes] = useState("");
  const [evalLevel, setEvalLevel] = useState<AcquisitionLevel>("en_cours");

  // Format distinct classes and subjects from courses
  const uniqueClasses = Array.from(new Set(courses.map(c => 
    typeof c.classId === 'string' ? c.classId : (c.classId as any)?.id || (c.classId as any)?._id
  ))).map(id => {
    const course = courses.find(c => (typeof c.classId === 'string' ? c.classId : (c.classId as any)?.id || (c.classId as any)?._id) === id);
    return { id, name: typeof course?.classId === 'object' ? (course.classId as any)?.name : "Classe" };
  }).filter(c => c.id);

  const uniqueSubjects = Array.from(new Set(courses.map(c => 
    typeof c.subjectId === 'string' ? c.subjectId : (c.subjectId as any)?.id || (c.subjectId as any)?._id
  ))).map(id => {
    const course = courses.find(c => (typeof c.subjectId === 'string' ? c.subjectId : (c.subjectId as any)?.id || (c.subjectId as any)?._id) === id);
    return { id, name: typeof course?.subjectId === 'object' ? (course.subjectId as any)?.name : "Matière" };
  }).filter(s => s.id);

  // Load initial teacher data
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user?.linkedId) return;
      try {
        setLoading(true);
        const fetchedCourses = await apiGetTeacherCourses(user.linkedId);
        setCourses(fetchedCourses);
        
        if (fetchedCourses.length > 0) {
          const firstCourse = fetchedCourses[0];
          const classId = typeof firstCourse.classId === 'string' ? firstCourse.classId : (firstCourse.classId as any)?.id || (firstCourse.classId as any)?._id;
          const subjectId = typeof firstCourse.subjectId === 'string' ? firstCourse.subjectId : (firstCourse.subjectId as any)?.id || (firstCourse.subjectId as any)?._id;
          setSelectedClass(classId);
          setSelectedSubject(subjectId);
        }
      } catch (error) {
        console.error("Failed to fetch teacher courses:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos classes et matières",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [user?.linkedId, toast]);

  // Load students when class changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;
      try {
        setLoadingStudents(true);
        const fetchedStudents = await apiGetStudentsByClass(selectedClass);
        setStudentsList(fetchedStudents);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  // Load competences when subject changes
  useEffect(() => {
    const fetchCompetences = async () => {
      if (!selectedSubject) return;
      try {
        const fetchedCompetences = await apiGetCompetencesBySubject(selectedSubject);
        setCompetencesList(fetchedCompetences);
      } catch (error) {
        console.error("Failed to fetch competences:", error);
      }
    };

    fetchCompetences();
  }, [selectedSubject]);

  // Load progress for all students when class, subject or competences change
  const fetchAllProgress = useCallback(async () => {
    if (studentsList.length === 0 || competencesList.length === 0) return;
    
    const progressMap: Record<string, Record<string, CompetenceProgress>> = {};
    
    try {
      // For performance, we could have an API that returns progress for all students in a class
      // But for now, we fetch for each and handle errors gracefully
      const promises = studentsList.flatMap(student => 
        competencesList.map(async competence => {
          try {
            const progress = await apiGetCompetenceProgress(student.id, competence.id);
            if (!progressMap[student.id]) progressMap[student.id] = {};
            progressMap[student.id][competence.id] = progress;
          } catch (e) {
            // Silently fail for individual student/competence pairs if they have no evaluations
          }
        })
      );
      
      await Promise.all(promises);
      setStudentProgress(progressMap);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  }, [studentsList, competencesList]);

  useEffect(() => {
    fetchAllProgress();
  }, [fetchAllProgress]);

  const handleOpenEvaluation = (studentId: string, competence: Competence) => {
    setSelectedStudent(studentId);
    setSelectedCompetence(competence);
    setSelectedObjectiveId(competence.objectives[0]?.id || "");
    setEvalLevel("en_cours");
    setEvalNotes("");
    setIsEvalDialogOpen(true);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedStudent || !selectedCompetence || !selectedObjectiveId || !user?.linkedId) return;

    try {
      setIsSubmitting(true);
      await apiCreateEvaluation({
        studentId: selectedStudent,
        competenceId: selectedCompetence.id,
        objectiveId: selectedObjectiveId,
        trimester: parseInt(selectedTrimester) as 1 | 2 | 3,
        level: evalLevel,
        notes: evalNotes || undefined,
        evaluatedBy: user.linkedId
      });

      toast({
        title: "Évaluation enregistrée",
        description: "La compétence a été évaluée avec succès",
      });

      setIsEvalDialogOpen(false);
      // Refresh progress
      fetchAllProgress();
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'évaluation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelBadge = (level: AcquisitionLevel) => {
    switch (level) {
      case "non_acquis":
        return <Badge variant="destructive">Non acquis</Badge>;
      case "en_cours":
        return <Badge variant="secondary">En cours</Badge>;
      case "acquis":
        return <Badge className="bg-green-500">Acquis</Badge>;
      case "expert":
        return <Badge className="bg-purple-500">Expert</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Évaluation des compétences</h1>
        <p className="text-muted-foreground">
          Évaluez les compétences des élèves par objectifs
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Classe</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {uniqueClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Matière</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSubjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Trimestre</label>
          <Select value={selectedTrimester} onValueChange={(v) => setSelectedTrimester(v as "1" | "2" | "3")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Trimestre 1</SelectItem>
              <SelectItem value="2">Trimestre 2</SelectItem>
              <SelectItem value="3">Trimestre 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Compétences de la matière */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Compétences - {uniqueSubjects.find(s => s.id === selectedSubject)?.name}
          </CardTitle>
          <CardDescription>
            {competencesList.length} compétences à évaluer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {competencesList.length > 0 ? competencesList.map((comp) => (
              <Card key={comp.id} className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {comp.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {comp.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Objectifs :</p>
                    <ul className="text-xs space-y-1">
                      {comp.objectives.map((obj) => (
                        <li key={obj.id} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {obj.level === "beginner" ? "Débutant" : obj.level === "intermediate" ? "Intermédiaire" : "Avancé"}
                          </Badge>
                          {obj.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Aucune compétence définie pour cette matière.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des élèves */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progression des élèves
          </CardTitle>
          <CardDescription>
            {loadingStudents ? "Chargement des élèves..." : `Classe : ${uniqueClasses.find(c => c.id === selectedClass)?.name} - Trimestre ${selectedTrimester}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  {competencesList.map((comp) => (
                    <TableHead key={comp.id} className="text-center">
                      {comp.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Progression globale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsList.length > 0 ? studentsList.map((student) => {
                  let totalProgress = 0;
                  const rowCompetences = competencesList.map((comp) => {
                    const progress = studentProgress[student.id]?.[comp.id] || { 
                      percentage: 0, 
                      acquired: 0, 
                      total: comp.objectives.length,
                      inProgress: 0,
                      notAcquired: comp.objectives.length
                    };
                    totalProgress += progress.percentage;
                    return { comp, progress };
                  });
                  const avgProgress = competencesList.length > 0 
                    ? totalProgress / competencesList.length 
                    : 0;

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      {rowCompetences.map(({ comp, progress }) => (
                        <TableCell key={comp.id} className="text-center">
                          <div className="space-y-1 min-w-[100px]">
                            <Progress 
                              value={progress.percentage} 
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground">
                              {progress.acquired}/{progress.total}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => handleOpenEvaluation(student.id, comp)}
                            >
                              Évaluer
                            </Button>
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress 
                            value={avgProgress} 
                            className={`h-3 w-20 ${getProgressColor(avgProgress)}`}
                          />
                          <span className="text-sm font-medium">{avgProgress.toFixed(0)}%</span>
                          {avgProgress >= 80 && <Award className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={competencesList.length + 2} className="text-center py-8 text-muted-foreground">
                      Aucun élève trouvé dans cette classe.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'évaluation */}
      <Dialog open={isEvalDialogOpen} onOpenChange={setIsEvalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Évaluer une compétence</DialogTitle>
            <DialogDescription>
              {selectedCompetence?.name} - {studentsList.find(s => s.id === selectedStudent)?.firstName} {studentsList.find(s => s.id === selectedStudent)?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Objectif à évaluer</label>
              <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un objectif" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCompetence?.objectives.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.name} ({obj.level === "beginner" ? "Débutant" : obj.level === "intermediate" ? "Intermédiaire" : "Avancé"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau d'acquisition</label>
              <div className="grid grid-cols-2 gap-2">
                {(["non_acquis", "en_cours", "acquis", "expert"] as AcquisitionLevel[]).map((level) => (
                  <Button
                    key={level}
                    variant={evalLevel === level ? "default" : "outline"}
                    onClick={() => setEvalLevel(level)}
                    className="justify-start gap-2"
                  >
                    {getLevelBadge(level)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optionnel)</label>
              <Textarea
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                placeholder="Ajoutez des observations..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEvalDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEvaluation} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
