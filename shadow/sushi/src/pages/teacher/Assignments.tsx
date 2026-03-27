/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  FileText,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Loader2,
  BookOpen,
  Sparkles,
  Brain,
  Trash
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  apiGetAssignmentsByTeacher,
  apiCreateAssignment,
  apiDeleteAssignment,
  apiUpdateAssignment,
  apiUploadAssignmentFile,
  apiGetAssignmentById
} from "@/services/api/assignments.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetTeacherCourses, apiGetAllCourses } from "@/services/api/courses.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import type { Assignment, CreateAssignmentDTO, AssignmentType, AssignmentSubmission, Question, QuestionType } from "@/types/assignment.types";
import { AssignmentDetailView } from "@/components/assignments/AssignmentDetailView";
import { QuestionBuilder } from "@/components/assignments/QuestionBuilder";
import { apiGradeSubmission } from "@/services/api/assignments.api";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";


export default function TeacherAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Selection State
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState(false);

  const resolveId = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return String(val.id || val._id || "");
  };


  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAssignmentDTO>>({
    type: "devoir",
    maxPoints: 20,
    attachments: [],
    questions: [],
    trimester: 1,
    academicYear: "2026-2027"
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);

  const resetForm = () => {
    setFormData({
      type: "devoir",
      maxPoints: 20,
      attachments: [],
      questions: [],
      trimester: 1,
      academicYear: "2026-2027"
    });
    setFiles([]);
    setEditingAssignment(null);
    setAiPrompt("");
  };

  const openEditDialog = async (assignment: Assignment) => {
    try {
      setLoading(true);
      const fullAssignment = await apiGetAssignmentById(assignment.id);
      setEditingAssignment(fullAssignment);
      setFormData({
        title: fullAssignment.title,
        description: fullAssignment.description,
        type: fullAssignment.type,
        classId: resolveId(fullAssignment.classId),
        courseId: resolveId(fullAssignment.courseId),
        dueDate: fullAssignment.dueDate ? new Date(fullAssignment.dueDate).toISOString().slice(0, 16) : "",
        maxPoints: fullAssignment.maxPoints,
        questions: fullAssignment.questions || [],
        rubric: fullAssignment.rubric || [],
        isWorksheet: fullAssignment.isWorksheet,
        trimester: fullAssignment.trimester || 1,
        academicYear: fullAssignment.academicYear || "2026-2027",
        status: fullAssignment.status,
      });
      setIsDialogOpen(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les détails du devoir." });
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignmentsData, classesData, teacherCourses, allCourses, subjectsData] = await Promise.all([
        user?.linkedId ? apiGetAssignmentsByTeacher(user.linkedId) : Promise.resolve([]),
        apiGetAllClasses(),
        user?.linkedId ? apiGetTeacherCourses(user.linkedId) : Promise.resolve([]),
        apiGetAllCourses(),
        apiGetAllSubjects()
      ]);
      setAssignments(assignmentsData);
      setSubjects(subjectsData);

      // Filtrer les classes pour ne montrer que celles du professeur si possible
      let filteredClasses = classesData;

      if (user?.linkedId && classesData.length > 0) {
        const teacherClassIds = new Set([
          ...teacherCourses.map((c: any) => resolveId(c.classId)),
          ...classesData.filter((c: any) => {
            const mainTeacherId = resolveId(c.mainTeacherId);
            return mainTeacherId === String(user.linkedId);
          }).map((c: any) => resolveId(c))
        ]);

        if (teacherClassIds.size > 0) {
          filteredClasses = classesData.filter((c: any) => teacherClassIds.has(resolveId(c)));
        }
      }

      // Si après filtrage on n'a rien mais qu'on a des classes globales, on montre tout
      if (filteredClasses.length === 0 && classesData.length > 0) {
        filteredClasses = classesData;
      }

      setClasses(filteredClasses);

      // Pour les cours, on prend ceux du prof + ceux des classes dont il est titulaire
      const relevantCourseIds = new Set(teacherCourses.map((c: any) => resolveId(c)));

      // Si titulaire d'une classe, on ajoute potentiellement tous les cours de cette classe
      classesData.forEach((cls: any) => {
        if (resolveId(cls.mainTeacherId) === String(user?.linkedId)) {
          allCourses.filter((c: any) => resolveId(c.classId) === resolveId(cls)).forEach((c: any) => {
            relevantCourseIds.add(resolveId(c));
          });
        }
      });

      const finalCourses = allCourses.filter((c: any) => relevantCourseIds.has(resolveId(c)));
      setCourses(finalCourses.length > 0 ? finalCourses : teacherCourses);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez saisir un sujet ou des instructions." });
      return;
    }

    try {
      setIsGeneratingIA(true);
      // Simulation d'appel IA
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockQuestions: Question[] = [];
      const count = Math.min(Math.max(1, aiQuestionCount), 20); // Limite entre 1 et 20

      const isWorksheet = !!formData.isWorksheet;

      for (let i = 1; i <= count; i++) {
        const type: QuestionType = i % 2 === 0 ? "short_answer" : "qcm";
        const exerciseNum = Math.ceil(i / 2);

        const q: Question = {
          id: Math.random().toString(36).substr(2, 9),
          text: isWorksheet
            ? `Consigne de l'exercice ${exerciseNum} sur ${aiPrompt} - Partie ${i % 2 === 0 ? 2 : 1}`
            : `Question ${i} sur ${aiPrompt} ?`,
          type,
          points: 5,
          exercise: isWorksheet ? `Exercice ${exerciseNum} : ${aiPrompt}` : undefined,
          ...(type === 'qcm' ? {
            options: [
              { id: "1", text: "Option A (Correcte)", isCorrect: true },
              { id: "2", text: "Option B", isCorrect: false },
              { id: "3", text: "Option C", isCorrect: false },
            ]
          } : {
            correctAnswer: "La réponse attendue"
          })
        };
        mockQuestions.push(q);
      }

      const mockRubric: any[] = [
        {
          id: Math.random().toString(36).substr(2, 9),
          criteria: "Maîtrise du sujet",
          description: `Démontre une compréhension approfondie de : ${aiPrompt}`,
          maxPoints: 10
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          criteria: "Qualité de la rédaction",
          description: "Clarté, orthographe et structure des réponses.",
          maxPoints: 10
        }
      ];

      setFormData(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...mockQuestions],
        rubric: [...(prev.rubric || []), ...mockRubric]
      }));

      toast({ title: "IA", description: "Questions générées avec succès." });
      setAiPrompt("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la génération IA." });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const removeQuestion = (id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== id)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.classId || !formData.courseId || !formData.dueDate) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const questionCount = formData.questions?.length || 0;
      console.log(`Saving assignment "${formData.title}" with ${questionCount} questions`);

      // Diagnostic toast to confirm what's being sent
      toast({
        title: "Sauvegarde en cours...",
        description: `Envoi de ${questionCount} question(s) au serveur.`
      });

      if (editingAssignment) {
        // UPDATE existing assignment
        const uploadedUrls: string[] = [...(editingAssignment.attachments || [])];
        if (files.length > 0) {
          for (const file of files) {
            const url = await apiUploadAssignmentFile(editingAssignment.id, file);
            if (url) uploadedUrls.push(url);
          }
        }

        // Prepare strict update payload
        const updatePayload: any = {
          ...formData,
          attachments: uploadedUrls,
          // Ensure questions are explicitly passed even if empty (to allow clearing)
          questions: formData.questions || []
        };

        await apiUpdateAssignment(editingAssignment.id, updatePayload);
        toast({ title: "Succès", description: "Le devoir a été modifié avec succès." });
      } else {
        // CREATE new assignment
        // First create with all data as draft or published
        const initialData = {
          ...formData,
          teacherId: user!.linkedId!,
          status: files.length > 0 ? "draft" : "published"
        };

        const created = await apiCreateAssignment(initialData as any);

        if (files.length > 0) {
          const uploadedUrls: string[] = [];
          for (const file of files) {
            const url = await apiUploadAssignmentFile(created.id, file);
            if (url) uploadedUrls.push(url);
          }

          // Final update to publish and add files
          await apiUpdateAssignment(created.id, {
            ...formData, // ENSURE questions are here too
            attachments: uploadedUrls,
            status: "published"
          });
        }

        toast({ title: "Succès", description: "Le devoir a été créé avec succès." });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving assignment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce devoir ?")) return;
    try {
      await apiDeleteAssignment(id);
      toast({ title: "Supprimé", description: "Le devoir a été supprimé." });
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer." });
    }
  };


  const handleGrade = async (data: { grade: number; feedback: string }) => {
    if (!selectedAssignmentId || !selectedStudentId) return;
    try {
      setSubmitting(true);
      await apiGradeSubmission(selectedAssignmentId, selectedStudentId, data);
      toast({ title: "Note enregistrée", description: "L'évaluation a été mise à jour avec succès." });

      // Refresh data
      await fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la note." });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);
  const selectedSubmission = selectedAssignment?.submissions?.find(s => {
    const sId = typeof s.studentId === 'object' ? s.studentId._id : s.studentId;
    return sId === selectedStudentId;
  });


  const getTypeBadge = (type: string) => {
    switch (type) {
      case "devoir": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Devoir</Badge>;
      case "tp": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">TP</Badge>;
      case "projet": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Projet</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // View 3: Grading Individual Submission
  if (selectedAssignment && selectedStudentId && selectedSubmission) {
    return (
      <AssignmentDetailView
        assignment={selectedAssignment}
        submission={selectedSubmission}
        mode="teacher"
        onBack={() => setSelectedStudentId(null)}
        onGrade={handleGrade}
        isSubmitting={submitting}
      />
    );
  }

  // View 2: Submissions List for selected Assignment
  if (selectedAssignment && viewingSubmissions) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => { setViewingSubmissions(false); setSelectedAssignmentId(null); }} className="gap-2 mb-2 p-0 hover:bg-transparent">
              <Plus className="h-4 w-4 rotate-45" /> {/* Using Plus rotated as X/Back */}
              Retour à la liste
            </Button>
            <h1 className="text-3xl font-black">{selectedAssignment.title}</h1>
            <p className="text-muted-foreground">Liste des rendus des élèves</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1">{selectedAssignment.submissions?.length || 0} Rendus</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {selectedAssignment.submissions?.length === 0 ? (
            <Card className="border-dashed py-12 text-center text-muted-foreground">Aucun rendu pour le moment.</Card>
          ) : (
            selectedAssignment.submissions?.map((sub: any) => {
              const student = sub.studentId;
              const isGraded = sub.status === 'graded';
              return (
                <Card key={sub.id} className="hover:shadow-md transition-all cursor-pointer border-none shadow-sm" onClick={() => setSelectedStudentId(typeof student === 'object' ? student._id : student)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {typeof student === 'object' ? student.firstName[0] + student.lastName[0] : 'ST'}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{typeof student === 'object' ? `${student.firstName} ${student.lastName}` : 'Élève'}</p>
                        <p className="text-sm text-muted-foreground italic">Remis le {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge className={cn(isGraded ? "bg-green-500" : "bg-blue-500")}>
                        {isGraded ? "Noté" : "À corriger"}
                      </Badge>
                      {isGraded && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase font-bold">Note</p>
                          <p className="text-xl font-black text-primary">{sub.grade}/{selectedAssignment.maxPoints}</p>
                        </div>
                      )}
                      <Button variant="outline" size="sm">Consulter</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Devoirs</h1>
          <p className="text-muted-foreground">Créez et gérez les devoirs pour vos classes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Devoir
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? "Modifier le devoir" : "Créer un nouveau devoir"}</DialogTitle>
              <DialogDescription>{editingAssignment ? "Modifiez les informations du devoir." : "Remplissez les informations ci-dessous pour créer un devoir."}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={formData.title || ""}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Dissertation Philosophique"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: AssignmentType) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="devoir">Devoir</SelectItem>
                      <SelectItem value="tp">Travaux Pratiques</SelectItem>
                      <SelectItem value="projet">Projet</SelectItem>
                      <SelectItem value="exposé">Exposé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trimestre</Label>
                  <Select
                    value={String(formData.trimester)}
                    onValueChange={v => setFormData({ ...formData, trimester: parseInt(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Trimestre 1</SelectItem>
                      <SelectItem value="2">Trimestre 2</SelectItem>
                      <SelectItem value="3">Trimestre 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Année Scolaire</Label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={v => setFormData({ ...formData, academicYear: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                      <SelectItem value="2026-2027">2026-2027</SelectItem>
                      <SelectItem value="2027-2028">2027-2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description / Consignes</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détaillez les consignes du devoir..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={v => {
                      // Quand on change de classe, on réinitialise la matière
                      setFormData({ ...formData, classId: v, courseId: undefined });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">Aucune classe disponible</div>
                      ) : (
                        classes.map(c => (
                          <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Matière</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={v => setFormData({ ...formData, courseId: v })}
                    disabled={!formData.classId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!formData.classId ? "Sélectionnez d'abord une classe" : "Sélectionner un cours"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses
                        .filter(c => {
                          const classId = resolveId(c.classId);
                          return classId === String(formData.classId || "");
                        })
                        .map(c => {
                          let subjectName = 'Matière';
                          if (typeof c.subjectId === 'object' && c.subjectId?.name) {
                            subjectName = c.subjectId.name;
                          } else {
                            const foundSubject = subjects.find(s => resolveId(s) === resolveId(c.subjectId));
                            subjectName = foundSubject?.name || c.name || 'Matière';
                          }
                          return (
                            <SelectItem key={c._id || c.id} value={c._id || c.id}>{subjectName}</SelectItem>
                          );
                        })
                      }
                      {formData.classId && courses.filter(c => {
                        const classId = typeof c.classId === 'object' ? (c.classId._id || c.classId.id) : c.classId;
                        return classId === formData.classId;
                      }).length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground">Aucun cours trouvé pour cette classe</div>
                        )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date limite</Label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDate || ""}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Points (Max)</Label>
                  <Input
                    type="number"
                    value={formData.maxPoints}
                    onChange={e => setFormData({ ...formData, maxPoints: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="isWorksheet"
                  checked={formData.isWorksheet}
                  onCheckedChange={(checked) => setFormData({ ...formData, isWorksheet: !!checked })}
                />
                <Label htmlFor="isWorksheet" className="cursor-pointer font-medium">Format "Fiche de Travail" (Papier)</Label>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Questions du devoir
                  </Label>
                </div>

                {/* Manual question builder */}
                <QuestionBuilder
                  questions={formData.questions || []}
                  onChange={(qs) => setFormData(prev => ({ ...prev, questions: qs }))}
                />

                {/* AI generation section */}
                <div className="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <Label className="text-xs uppercase font-bold text-primary">Ou générer avec l'IA</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Photosynthèse..."
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={aiQuestionCount}
                      onChange={e => setAiQuestionCount(parseInt(e.target.value) || 1)}
                      className="w-20"
                      title="Nombre de questions"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingIA}
                    >
                      {isGeneratingIA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Générer
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAssignment ? "Enregistrer les modifications" : "Créer le devoir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map(assignment => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 mb-2">
                  {getTypeBadge(assignment.type)}
                  <Badge variant={assignment.status === "published" ? "default" : "secondary"}>
                    {assignment.status === "published" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(assignment); }}>
                      <Edit className="mr-2 h-4 w-4" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(assignment.id, e)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>

                </DropdownMenu>
              </div>
              <CardTitle className="line-clamp-1">{assignment.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {assignment.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Pour le {new Date(assignment.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>
                    {typeof assignment.classId === 'object' && (assignment.classId as any).name
                      ? (assignment.classId as any).name
                      : (classes.find(c => resolveId(c) === resolveId(assignment.classId))?.name || 'Classe')}
                  </span>
                </div>
                {assignment.courseId && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium text-foreground">
                      {(() => {
                        const c = assignment.courseId as any;
                        if (typeof c === 'object') {
                          if (c.subjectId?.name) return c.subjectId.name;
                          if (c.name) return c.name;
                          const foundSub = subjects.find(s => resolveId(s) === resolveId(c.subjectId));
                          return foundSub?.name || 'Matière';
                        }
                        return 'Matière';
                      })()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                <div className="flex gap-4">
                  <div className="text-center">
                    <span className="block font-bold text-lg">{assignment.submissions?.length || 0}</span>
                    <span className="text-xs text-muted-foreground">Rendus</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-lg text-green-600">
                      {assignment.submissions?.filter(s => s.status === 'graded').length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Corrigés</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const full = await apiGetAssignmentById(assignment.id);
                      // Update the local list so the detail view has everything
                      setAssignments(prev => prev.map(a => a.id === full.id ? full : a));
                      setSelectedAssignmentId(assignment.id);
                      setViewingSubmissions(true);
                    } catch (error) {
                      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les détails du devoir." });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Voir les rendus
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
