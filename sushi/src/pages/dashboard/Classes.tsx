/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search, Users, GraduationCap, BookOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiGetAllClasses, apiCreateClass, apiUpdateClass, apiDeleteClass } from "@/services/api/classes.api";
import { apiGetAllTeachers, apiUpdateTeacher } from "@/services/api/teachers.api";
import { getCurrentSchoolId, setCurrentSchoolId } from "@/services/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Class, Teacher, CreateClassDTO } from "@/types";

const levelOptions = [
  "6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"
];

const sectionOptions = ["A", "B", "C", "D"];

const currentYear = new Date().getFullYear();
const academicYearOptions = [
  `${currentYear - 1}-${currentYear}`,
  `${currentYear}-${currentYear + 1}`,
  `${currentYear + 1}-${currentYear + 2}`
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<CreateClassDTO>({
    name: "",
    level: "",
    section: "",
    academicYear: academicYearOptions[1],
    mainTeacherId: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesData, teachersData] = await Promise.all([
        apiGetAllClasses(),
        apiGetAllTeachers()
      ]);
      setClasses(classesData);
      setTeachers(teachersData);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.level.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || cls.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getRawId = (data: any): string => {
    if (!data) return "";
    return typeof data === "string" ? data : (data.id || data._id || "");
  };

  const getTeacherId = (teacherId: any): string => {
    return getRawId(teacherId);
  };

  const getTeacherName = (teacherId: any) => {
    const id = getRawId(teacherId);
    if (!id) return "Non assigné";
    
    // Si l'objet est déjà peuplé avec les noms
    if (typeof teacherId === "object" && (teacherId.firstName || teacherId.lastName)) {
      return `${teacherId.firstName || ""} ${teacherId.lastName || ""}`.trim() || "Sans nom";
    }

    // Chercher dans la liste locale des professeurs
    const idStr = String(id);
    const teacher = teachers.find(t => String(getRawId(t)) === idStr);
    
    if (teacher) {
      return `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();
    }

    return "Non assigné";
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: "",
      section: "",
      academicYear: academicYearOptions[1],
      mainTeacherId: ""
    });
  };

  const { user } = useAuth();

  const handleAdd = async () => {
    if (!formData.name || !formData.level || !formData.section) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const schoolId = getCurrentSchoolId() || user?.schoolId;

    if (!schoolId) {
      toast.error("ID de l'école manquant. Veuillez vous reconnecter.");
      return;
    }

    // Sauvegarder dans localStorage si on l'a récupéré du user
    if (!getCurrentSchoolId() && user?.schoolId) {
      setCurrentSchoolId(user.schoolId);
    }

    try {
      const newClass = await apiCreateClass({ ...formData, schoolId } as any);
      
      // SYNC: Si un prof est assigné, on met à jour son profil
      if (formData.mainTeacherId) {
        const teacher = teachers.find(t => t.id === formData.mainTeacherId || (t as any)._id === formData.mainTeacherId);
        if (teacher) {
          const currentClassIds = (teacher.classes || []).map(getRawId);
          const updatedClasses = [...new Set([...currentClassIds, newClass.id])];
          await apiUpdateTeacher(teacher.id, {
            mainClassId: newClass.id,
            classes: updatedClasses
          });
        }
      }

      setClasses(prev => [...prev, newClass]);
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Classe créée avec succès");
      loadData(); // Recharger pour être sûr de la synchronisation
    } catch (error) {
      toast.error("Erreur lors de la création de la classe");
      console.error(error);
    }
  };

  const handleEdit = (cls: Class) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      section: cls.section,
      academicYear: cls.academicYear,
      mainTeacherId: getTeacherId(cls.mainTeacherId)
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedClass || !formData.name || !formData.level || !formData.section) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const schoolId = getCurrentSchoolId() || user?.schoolId;

    try {
      const updatedClass = await apiUpdateClass(selectedClass.id, { ...formData, schoolId } as any);
      if (updatedClass) {
        // SYNC: Mettre à jour le nouveau professeur principal
        if (formData.mainTeacherId) {
          const teacher = teachers.find(t => t.id === formData.mainTeacherId || (t as any)._id === formData.mainTeacherId);
          if (teacher) {
            const currentClassIds = (teacher.classes || []).map(getRawId);
            const updatedClasses = [...new Set([...currentClassIds, updatedClass.id])];
            await apiUpdateTeacher(teacher.id, {
              mainClassId: updatedClass.id,
              classes: updatedClasses
            });
          }
        }

        // Optionnel: On pourrait aussi retirer la classe de l'ancien prof si nécessaire
        // Mais dans Scholar Buddy, un prof peut avoir plusieurs classes, 1 seule principale.

        setClasses(prev => prev.map(c => c.id === selectedClass.id ? updatedClass : c));
        setIsEditDialogOpen(false);
        setSelectedClass(null);
        resetForm();
        toast.success("Classe modifiée avec succès");
        loadData(); // Recharger pour être sûr de la synchronisation
      }
    } catch (error) {
      toast.error("Erreur lors de la modification de la classe");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteClass(id);
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success("Classe supprimée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression de la classe");
      console.error(error);
    }
  };

  const stats = {
    total: classes.length,
    totalStudents: classes.reduce((sum, c) => sum + (c.studentCount || 0), 0),
    levels: [...new Set(classes.map(c => c.level))].length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Classes</h1>
          <p className="text-muted-foreground">Gérez les classes de votre établissement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Classe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle classe</DialogTitle>
                <DialogDescription>Remplissez les informations pour créer une classe</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la classe *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: 6ème A" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Niveau *</Label>
                    <Select value={formData.level} onValueChange={v => setFormData(prev => ({ ...prev, level: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {levelOptions.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section *</Label>
                    <Select value={formData.section} onValueChange={v => setFormData(prev => ({ ...prev, section: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionOptions.map(section => (
                          <SelectItem key={section} value={section}>{section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Année scolaire</Label>
                  <Select value={formData.academicYear} onValueChange={v => setFormData(prev => ({ ...prev, academicYear: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearOptions.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mainTeacher">Professeur principal</Label>
                  <Select 
                    value={formData.mainTeacherId || "none"} 
                    onValueChange={v => setFormData(prev => ({ ...prev, mainTeacherId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un professeur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleAdd}>Créer la classe</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.levels} niveaux différents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Élèves</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Répartis dans toutes les classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par classe</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round(stats.totalStudents / stats.total) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Élèves par classe</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une classe..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrer par niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {levelOptions.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Année scolaire</TableHead>
                <TableHead>Professeur principal</TableHead>
                <TableHead className="text-center">Élèves</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune classe trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map(cls => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.level}</Badge>
                    </TableCell>
                    <TableCell>{cls.section}</TableCell>
                    <TableCell>{cls.academicYear}</TableCell>
                    <TableCell>{getTeacherName(cls.mainTeacherId)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{cls.studentCount || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la classe ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. La classe "{cls.name}" sera définitivement supprimée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cls.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la classe</DialogTitle>
            <DialogDescription>Modifiez les informations de la classe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de la classe *</Label>
              <Input 
                id="edit-name" 
                value={formData.name} 
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: 6ème A" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-level">Niveau *</Label>
                <Select value={formData.level} onValueChange={v => setFormData(prev => ({ ...prev, level: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section *</Label>
                <Select value={formData.section} onValueChange={v => setFormData(prev => ({ ...prev, section: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-academicYear">Année scolaire</Label>
              <Select value={formData.academicYear} onValueChange={v => setFormData(prev => ({ ...prev, academicYear: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {academicYearOptions.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mainTeacher">Professeur principal</Label>
              <Select 
                value={formData.mainTeacherId || "none"} 
                onValueChange={v => setFormData(prev => ({ ...prev, mainTeacherId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un professeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
