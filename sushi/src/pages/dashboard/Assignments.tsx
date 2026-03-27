/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  FileText,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  ClipboardList,
  Beaker,
  Presentation,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { 
  apiGetAllAssignments, 
  apiCreateAssignment, 
  apiUpdateAssignment, 
  apiDeleteAssignment 
} from "@/services/api/assignments.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import { apiGetAllCourses } from "@/services/api/courses.api";
import { apiGetAllStudents } from "@/services/api/students.api";
import { Assignment, Class, Subject, Course, Student } from "@/types";

const typeIcons: Record<string, any> = {
  devoir: ClipboardList,
  tp: Beaker,
  projet: BookOpen,
  exposé: Presentation,
};

const typeColors: Record<string, string> = {
  devoir: "bg-blue-500",
  tp: "bg-green-500",
  projet: "bg-purple-500",
  exposé: "bg-orange-500",
};

const statusColors: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  published: "default",
  closed: "outline",
};

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignmentsData, classesData, subjectsData, coursesData, studentsData] = await Promise.all([
        apiGetAllAssignments(),
        apiGetAllClasses(),
        apiGetAllSubjects(),
        apiGetAllCourses(),
        apiGetAllStudents(),
      ]);
      setAssignments(assignmentsData);
      setClasses(classesData);
      setSubjects(subjectsData);
      setCourses(coursesData);
      setStudents(studentsData);
    } catch (err) {
      console.error("Failed to load assignments data:", err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || assignment.type === filterType;
    
    const classId = typeof assignment.classId === "object" ? assignment.classId._id : assignment.classId;
    const matchesClass = filterClass === "all" || classId === filterClass;
    
    const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;
    
    return matchesSearch && matchesType && matchesClass && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    published: assignments.filter(a => a.status === "published").length,
    graded: assignments.filter(a => a.submissions?.some(s => s.status === "graded")).length,
    pending: assignments.filter(a => a.submissions?.some(s => s.status === "submitted")).length,
  };

  const getClassName = (classId: any) => {
    const id = typeof classId === "object" ? classId._id : classId;
    return classes.find(c => c.id === id)?.name || "Classe inconnue";
  };

  const getSubjectName = (assignment: Assignment) => {
    if (typeof assignment.courseId === "object" && assignment.courseId.name) {
       return assignment.courseId.name;
    }
    // Fallback if course is just ID
    const course = courses.find(c => (c as any).id === assignment.courseId || (c as any)._id === assignment.courseId);
    if (course) {
        return typeof course.subjectId === "object" ? course.subjectId.name : "Matière";
    }
    return "Matière inconnue";
  };

  const getSubmissionStats = (assignment: Assignment) => {
    const classId = typeof assignment.classId === "object" ? assignment.classId._id : assignment.classId;
    const classStudents = students.filter(s => s.classId === classId);
    const submitted = assignment.submissions?.length || 0;
    const graded = assignment.submissions?.filter(s => s.status === "graded").length || 0;
    return { total: classStudents.length, submitted, graded };
  };

  const handleAddAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const classId = formData.get("class") as string;
    const subjectId = formData.get("subject") as string;
    
    // Find course for this class and subject
    const course = courses.find(c => {
        const cClassId = typeof c.classId === "object" ? c.classId._id : c.classId;
        const cSubjectId = typeof c.subjectId === "object" ? c.subjectId._id : c.subjectId;
        return cClassId === classId && cSubjectId === subjectId;
    });

    if (!course) {
        toast.error("Aucun cours trouvé pour cette combinaison classe/matière");
        return;
    }

    try {
        const newAssignment = await apiCreateAssignment({
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            type: formData.get("type") as any,
            subjectId: subjectId, // Not strictly required by backend if courseId is present but DTO might want it
            classId: classId,
            courseId: course.id,
            teacherId: typeof course.teacherId === "object" ? course.teacherId._id : course.teacherId,
            dueDate: formData.get("dueDate") as string,
            maxPoints: parseInt(formData.get("maxPoints") as string) || 20,
            status: formData.get("status") as any,
        } as any);

        setAssignments([newAssignment, ...assignments]);
        setIsDialogOpen(false);
        toast.success(`"${newAssignment.title}" a été créé avec succès.`);
    } catch (err) {
        console.error("Failed to create assignment:", err);
        toast.error("Erreur lors de la création du devoir");
    }
  };

  const handleEditAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    
    const formData = new FormData(e.currentTarget);
    const updates = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as any,
      dueDate: formData.get("dueDate") as string,
      maxPoints: parseInt(formData.get("maxPoints") as string) || 20,
      status: formData.get("status") as any,
    };

    try {
        const updated = await apiUpdateAssignment(selectedAssignment.id, updates);
        if (updated) {
            setAssignments(assignments.map(a => a.id === selectedAssignment.id ? updated : a));
            setIsEditDialogOpen(false);
            setSelectedAssignment(null);
            toast.success("Devoir modifié avec succès");
        }
    } catch (err) {
        console.error("Failed to update assignment:", err);
        toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce devoir ?")) return;
    try {
        await apiDeleteAssignment(assignment.id);
        setAssignments(assignments.filter(a => a.id !== assignment.id));
        toast.success(`"${assignment.title}" a été supprimé.`);
    } catch (err) {
        console.error("Failed to delete assignment:", err);
        toast.error("Erreur lors de la suppression");
    }
  };

  const AssignmentForm = ({ onSubmit, defaultValues, submitLabel }: { 
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; 
    defaultValues?: Partial<Assignment>;
    submitLabel: string;
  }) => {
    const classId = defaultValues?.classId ? (typeof defaultValues.classId === "object" ? defaultValues.classId._id : defaultValues.classId) : "";
    const courseId = defaultValues?.courseId ? (typeof defaultValues.courseId === "object" ? defaultValues.courseId._id : defaultValues.courseId) : "";
    
    // For edit mode, find the subject from course
    let subjectId = "";
    if (courseId) {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            subjectId = typeof course.subjectId === "object" ? course.subjectId._id : course.subjectId;
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={defaultValues?.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={defaultValues?.description} 
              rows={3}
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={defaultValues?.type || "devoir"}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devoir">Devoir</SelectItem>
                  <SelectItem value="tp">Travail Pratique</SelectItem>
                  <SelectItem value="projet">Projet</SelectItem>
                  <SelectItem value="exposé">Exposé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPoints">Points max</Label>
              <Input 
                id="maxPoints" 
                name="maxPoints" 
                type="number" 
                defaultValue={defaultValues?.maxPoints || 20} 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Matière</Label>
              <Select name="subject" defaultValue={subjectId} disabled={!!defaultValues?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Classe</Label>
              <Select name="class" defaultValue={classId} disabled={!!defaultValues?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date limite</Label>
              <Input 
                id="dueDate" 
                name="dueDate" 
                type="date" 
                defaultValue={defaultValues?.dueDate ? new Date(defaultValues.dueDate).toISOString().split('T')[0] : ""} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select name="status" defaultValue={defaultValues?.status || "draft"}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="closed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full">{submitLabel}</Button>
        </form>
    );
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devoirs & Travaux</h1>
          <p className="text-muted-foreground">Gestion des devoirs, TP, projets et exposés</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau devoir
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un nouveau devoir</DialogTitle>
              <DialogDescription>
                Définissez les détails du devoir ou travail pratique.
              </DialogDescription>
            </DialogHeader>
            <AssignmentForm onSubmit={handleAddAssignment} submitLabel="Créer le devoir" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total devoirs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-sm text-muted-foreground">Publiés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">À corriger</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-500/10 p-3">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.graded}</p>
              <p className="text-sm text-muted-foreground">Corrigés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Liste des devoirs</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="devoir">Devoir</SelectItem>
                  <SelectItem value="tp">TP</SelectItem>
                  <SelectItem value="projet">Projet</SelectItem>
                  <SelectItem value="exposé">Exposé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="closed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Date limite</TableHead>
                  <TableHead>Soumissions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const TypeIcon = typeIcons[assignment.type] || ClipboardList;
                  const submissionStats = getSubmissionStats(assignment);
                  const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === "published";

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className={`rounded-full p-2 w-fit ${typeColors[assignment.type] || "bg-gray-500"}`}>
                          <TypeIcon className="h-4 w-4 text-white" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{assignment.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getSubjectName(assignment)}</TableCell>
                      <TableCell>{getClassName(assignment.classId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isOverdue ? "text-destructive" : ""}>
                            {new Date(assignment.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                          {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {submissionStats.submitted}/{submissionStats.total}
                          </span>
                          {submissionStats.graded > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {submissionStats.graded} notés
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[assignment.status]}>
                          {assignment.status === "published" ? "Publié" : assignment.status === "draft" ? "Brouillon" : "Fermé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setSelectedAssignment(assignment); setIsViewDialogOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setSelectedAssignment(assignment); setIsEditDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(assignment)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le devoir</DialogTitle>
            <DialogDescription>
              Modifiez les détails du devoir.
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <AssignmentForm 
              onSubmit={handleEditAssignment} 
              defaultValues={selectedAssignment}
              submitLabel="Enregistrer" 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du devoir</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-3 ${typeColors[selectedAssignment.type] || "bg-gray-500"}`}>
                  {(() => {
                    const TypeIcon = typeIcons[selectedAssignment.type] || ClipboardList;
                    return <TypeIcon className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedAssignment.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getSubjectName(selectedAssignment)} - {getClassName(selectedAssignment.classId)}
                  </p>
                </div>
                <Badge variant={statusColors[selectedAssignment.status]} className="ml-auto">
                  {selectedAssignment.status}
                </Badge>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedAssignment.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Date limite</p>
                  <p>{new Date(selectedAssignment.dueDate).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Points maximum</p>
                  <p>{selectedAssignment.maxPoints} points</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Créé le</p>
                  <p>{selectedAssignment.createdAt ? new Date(selectedAssignment.createdAt).toLocaleDateString("fr-FR") : "-"}</p>
                </div>
              </div>

              {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Soumissions ({selectedAssignment.submissions.length})</h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Élève</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAssignment.submissions.map((sub: any) => {
                          const sId = typeof sub.studentId === "object" ? sub.studentId._id : sub.studentId;
                          const student = students.find(s => s.id === sId);
                          return (
                            <TableRow key={sub.id}>
                              <TableCell>{student ? `${student.firstName} ${student.lastName}` : "Élève inconnu"}</TableCell>
                              <TableCell>{new Date(sub.submittedAt).toLocaleDateString("fr-FR")}</TableCell>
                              <TableCell>
                                <Badge variant={sub.status === "graded" ? "default" : "secondary"}>
                                  {sub.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {sub.grade !== undefined ? `${sub.grade}/${selectedAssignment.maxPoints}` : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
