/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen,
  Loader2,
  Trash2,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  apiGetAllCourses, 
  apiCreateCourse, 
  apiUpdateCourse,
  apiDeleteCourse 
} from "@/services/api/courses.api";
import { 
  apiGetAllSubjects, 
  apiCreateSubject, 
  apiUpdateSubject, 
  apiDeleteSubject 
} from "@/services/api/subjects.api";
import { apiGetAllTeachers, apiUpdateTeacher } from "@/services/api/teachers.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { getCurrentSchoolId } from "@/services/api/client";
import type { Course, Subject, Teacher, Class, CreateSubjectDTO } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const joursMap: Record<string, number> = {
  "Lundi": 1, "Mardi": 2, "Mercredi": 3, "Jeudi": 4, "Vendredi": 5, "Samedi": 6, "Dimanche": 0
};
const revJoursMap: Record<number, string> = {
  1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 0: "Dim"
};
const heures = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const categories = [
  { value: "scientifique", label: "Scientifique" },
  { value: "litteraire", label: "Littéraire" },
  { value: "artistique", label: "Artistique" },
  { value: "sportif", label: "Sportif" },
];

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // États pour la gestion des matières
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Subject["category"]>("scientifique");
  
  // États pour le formulaire dynamique
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedJour, setSelectedJour] = useState<string>("");
  const [selectedHeureDebut, setSelectedHeureDebut] = useState<string>("");
  const [selectedHeureFin, setSelectedHeureFin] = useState<string>("");
  const [selectedSalle, setSelectedSalle] = useState<string>("");
  
  // État pour basculer entre les vues
  const [activeTab, setActiveTab] = useState<"subjects" | "schedule">("subjects");
  
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [coursesData, subjectsData, teachersData, classesData] = await Promise.all([
        apiGetAllCourses(),
        apiGetAllSubjects(),
        apiGetAllTeachers(),
        apiGetAllClasses()
      ]);
      setCourses(coursesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setClasses(classesData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des cours.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Gérer le paramètre teacherId de l'URL
  useEffect(() => {
    const teacherIdParam = searchParams.get("teacherId");
    if (teacherIdParam && teachers.length > 0) {
      const teacher = teachers.find(t => t.id === teacherIdParam || String((t as { _id?: string })._id) === teacherIdParam);
      if (teacher) {
        setSelectedTeacherId(teacher.id);
        setIsDialogOpen(true);
      }
    }
  }, [searchParams, teachers]);

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    const subId = typeof course.subjectId === 'object' ? course.subjectId._id : course.subjectId;
    const tId = typeof course.teacherId === 'object' ? course.teacherId._id : course.teacherId;
    const cId = typeof course.classId === 'object' ? course.classId._id : course.classId;
    setSelectedSubjectId(subId as string);
    setSelectedTeacherId(tId as string);
    setSelectedClassId(cId as string);
    setSelectedJour(Object.entries(joursMap).find(([, v]) => v === course.dayOfWeek)?.[0] || "");
    setSelectedHeureDebut(course.startTime);
    setSelectedHeureFin(course.endTime);
    setSelectedSalle(course.room);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCourse(null);
    setSelectedSubjectId("");
    setSelectedTeacherId("");
    setSelectedClassId("");
    setSelectedJour("");
    setSelectedHeureDebut("");
    setSelectedHeureFin("");
    setSelectedSalle("");
  };

  // Helper : extrait l'ID quel que soit le format (string ou objet populé)
  const resolveId = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    const obj = val as Record<string, unknown>;
    return (obj._id ?? obj.id ?? "") as string;
  };

  const getSubjectName = (val: unknown) => {
    // Si l'objet est déjà populé, on prend directement le name
    if (val && typeof val === "object") {
      const o = val as Record<string, unknown>;
      if (o.name) return o.name as string;
    }
    const id = resolveId(val);
    return subjects.find(s => s.id === id)?.name || "Matière inconnue";
  };

  const getTeacherName = (val: unknown) => {
    if (val && typeof val === "object") {
      const o = val as Record<string, unknown>;
      if (o.firstName || o.lastName) return `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim();
    }
    const id = String(resolveId(val));
    const t = teachers.find(t => String(resolveId(t)) === id);
    return t ? `${t.firstName} ${t.lastName}` : "Professeur inconnu";
  };

  const getClassName = (val: unknown) => {
    if (val && typeof val === "object") {
      const o = val as Record<string, unknown>;
      if (o.name) return o.name as string;
    }
    const id = String(resolveId(val));
    const c = classes.find(c => String(resolveId(c)) === id);
    return c ? c.name : "Classe inconnue";
  };

  // Fonctions pour gérer les matières
  const openSubjectEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setSelectedCategory(subject.category);
    setIsSubjectDialogOpen(true);
  };

  const resetSubjectForm = () => {
    setEditingSubject(null);
    setSelectedCategory("scientifique");
  };

  const handleSubjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = getCurrentSchoolId() || user?.schoolId;
    
    if (!schoolId) {
      toast({
        title: "Erreur de configuration",
        description: "ID de l'école manquant. Veuillez vous reconnecter.",
        variant: "destructive",
      });
      return;
    }

    try {
      const subjectData = {
        name: formData.get("name") as string,
        code: formData.get("code") as string,
        coefficient: Number(formData.get("coefficient")),
        category: selectedCategory,
        domaine: formData.get("domaine") as string,
        schoolId,
      };

      if (editingSubject) {
        await apiUpdateSubject(editingSubject.id, subjectData);
        toast({
          title: "Succès",
          description: "Matière mise à jour avec succès",
        });
      } else {
        await apiCreateSubject(subjectData);
        toast({
          title: "Succès",
          description: "Matière créée avec succès",
        });
      }

      setIsSubjectDialogOpen(false);
      resetSubjectForm();
      fetchData(); // Recharger les données
    } catch (error: any) {
      // Gérer spécifiquement les erreurs de doublon de code
      if (error?.response?.data?.error === "DUPLICATE_CODE") {
        const errorData = error.response.data;
        toast({
          title: "Code déjà utilisé",
          description: (
            <div className="space-y-2">
              <p>{errorData.message}</p>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm font-medium">{errorData.suggestion.message}</span>
                <span className="text-sm font-bold text-primary">{errorData.suggestion.code}</span>
                <button
                  onClick={() => {
                    const codeInput = document.getElementById('code') as HTMLInputElement;
                    if (codeInput) {
                      codeInput.value = errorData.suggestion.code;
                    }
                  }}
                  className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
                >
                  Utiliser ce code
                </button>
              </div>
            </div>
          ),
          duration: 8000,
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder la matière",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette matière ?")) return;

    try {
      await apiDeleteSubject(subjectId);
      toast({
        title: "Succès",
        description: "Matière supprimée avec succès",
      });
      fetchData(); // Recharger les données
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la matière",
        variant: "destructive",
      });
    }
  };

  const filteredCourses = courses.filter((course) => {
    const subjectName = getSubjectName(course.subjectId).toLowerCase();
    const teacherName = getTeacherName(course.teacherId).toLowerCase();
    const className = getClassName(course.classId).toLowerCase();
    const query = searchTerm.toLowerCase();
    
    return subjectName.includes(query) || teacherName.includes(query) || className.includes(query);
  });

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper : vérifie si un teacher enseigne une matière (subjects peut contenir strings ou objets populés)
  const teacherHasSubject = (t: Teacher, subjectId: string) =>
    (t.subjects as unknown[]).some(s => resolveId(s) === subjectId || s === subjectId);

  const handleAddCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dayName = selectedJour || formData.get("jour") as string;
    const schoolId = getCurrentSchoolId();
    
    const courseData = {
      subjectId: selectedSubjectId || formData.get("subjectId") as string,
      teacherId: selectedTeacherId || formData.get("teacherId") as string,
      classId: selectedClassId || formData.get("classId") as string,
      dayOfWeek: joursMap[dayName] ?? 1,
      startTime: selectedHeureDebut || formData.get("heureDebut") as string,
      endTime: selectedHeureFin || formData.get("heureFin") as string,
      room: selectedSalle || (formData.get("salle") as string),
      schoolId: schoolId || undefined,
    };

    try {
      if (editingCourse) {
        const updated = await apiUpdateCourse(editingCourse.id, courseData);
        if (updated) {
          setCourses(courses.map(c => c.id === editingCourse.id ? updated : c));
        }
        toast({ title: "Cours modifié", description: "Le cours a été mis à jour avec succès." });
      } else {
        const createdCourse = await apiCreateCourse(courseData);
        setCourses([...courses, createdCourse]);

        // SYNC: Ajouter la classe à la liste du professeur s'il n'y est pas déjà
        if (selectedTeacherId && selectedClassId) {
          const teacher = teachers.find(t => t.id === selectedTeacherId || (t as any)._id === selectedTeacherId);
          if (teacher) {
            const currentClassIds = (teacher.classes || []).map(resolveId);
            const hasClass = currentClassIds.includes(selectedClassId);
            if (!hasClass || !teacher.mainClassId) {
              const updatedClasses = [...new Set([...currentClassIds, selectedClassId])];
              await apiUpdateTeacher(teacher.id, {
                classes: updatedClasses,
                ...(!teacher.mainClassId ? { mainClassId: selectedClassId } : {})
              });
            }
          }
        }

        toast({ title: "Cours créé", description: "Le cours a été créé avec succès." });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData(); // Recharger pour être sûr de la synchronisation
    } catch (error) {
      toast({
        title: "Erreur",
        description: editingCourse ? "Impossible de modifier le cours." : "Impossible de créer le cours.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
      toast({
        title: "Cours supprimé",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le cours.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Cours</h1>
          <p className="text-muted-foreground">
            Gérez les matières et l'emploi du temps de votre établissement
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "subjects" && (
            <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetSubjectForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle matière
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSubject ? "Modifier la matière" : "Créer une nouvelle matière"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSubject 
                      ? "Modifiez les informations de la matière" 
                      : "Ajoutez une nouvelle matière à l'établissement"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubjectSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de la matière</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Ex: Mathématiques" 
                        defaultValue={editingSubject?.name || ""}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Code</Label>
                      <Input 
                        id="code" 
                        name="code" 
                        placeholder="Ex: MATH" 
                        defaultValue={editingSubject?.code || ""}
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coefficient">Coefficient</Label>
                      <Input 
                        id="coefficient" 
                        name="coefficient" 
                        type="number" 
                        min="1" 
                        max="10" 
                        placeholder="Ex: 3" 
                        defaultValue={editingSubject?.coefficient || 1}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Subject["category"])} >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domaine">Domaine (optionnel)</Label>
                    <Input 
                      id="domaine" 
                      name="domaine" 
                      placeholder="Ex: DOMAINE DES SCIENCES" 
                      defaultValue={editingSubject?.domaine || ""}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingSubject ? "Mettre à jour" : "Créer la matière"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {activeTab === "schedule" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau cours
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCourse ? "Modifier le cours" : "Créer un nouveau cours"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCourse 
                      ? "Modifiez les informations du cours" 
                      : "Ajoutez un nouveau cours à l'emploi du temps"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectId">Matière</Label>
                    <Select name="subjectId" value={selectedSubjectId} onValueChange={setSelectedSubjectId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherId">Professeur</Label>
                    <Select name="teacherId" value={selectedTeacherId} onValueChange={setSelectedTeacherId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.firstName} {t.lastName}
                            {selectedSubjectId && !teacherHasSubject(t, selectedSubjectId) && 
                              " (Non qualifié pour cette matière)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSubjectId && selectedTeacherId && !teacherHasSubject(
                      teachers.find(t => t.id === selectedTeacherId)!, selectedSubjectId
                    ) && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        Attention: Ce professeur n'est pas marqué comme enseignant cette matière.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classId">Classe</Label>
                    <Select name="classId" value={selectedClassId} onValueChange={setSelectedClassId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jour">Jour</Label>
                      <Select name="jour" value={selectedJour} onValueChange={setSelectedJour} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Jour" />
                        </SelectTrigger>
                        <SelectContent>
                          {jours.map((j) => (
                            <SelectItem key={j} value={j}>{j}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heureDebut">Début</Label>
                      <Select name="heureDebut" value={selectedHeureDebut} onValueChange={setSelectedHeureDebut} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Heure" />
                        </SelectTrigger>
                        <SelectContent>
                          {heures.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heureFin">Fin</Label>
                      <Select name="heureFin" value={selectedHeureFin} onValueChange={setSelectedHeureFin} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Heure" />
                        </SelectTrigger>
                        <SelectContent>
                          {heures.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salle">Salle</Label>
                    <Input id="salle" name="salle" placeholder="Ex: Salle 101" value={selectedSalle} onChange={(e) => setSelectedSalle(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full">{editingCourse ? "Enregistrer" : "Créer le cours"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("subjects")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "subjects"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Matières
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "schedule"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Emploi du temps
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={activeTab === "subjects" ? "Rechercher une matière..." : "Rechercher un cours..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contenu des onglets */}
      {activeTab === "subjects" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <Card key={subject.id} className="transition-shadow hover:shadow-lg relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{subject.code}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSubjectEditDialog(subject)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSubject(subject.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="mt-3">{subject.name}</CardTitle>
                  <CardDescription>
                    Coefficient: {subject.coefficient} • {categories.find(c => c.value === subject.category)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {subject.domaine && (
                    <div className="text-sm text-muted-foreground">
                      Domaine: {subject.domaine}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Aucune matière trouvée.
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <Card key={course.id} className="transition-shadow hover:shadow-lg relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{getClassName(course.classId)}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(course)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(course.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="mt-3">{getSubjectName(course.subjectId)}</CardTitle>
                  <CardDescription>{getTeacherName(course.teacherId)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {revJoursMap[course.dayOfWeek]} {course.startTime} - {course.endTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {course.room}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Aucun cours trouvé.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
