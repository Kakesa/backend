/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  LayoutGrid, 
  List, 
  Download, 
  Filter, 
  Phone, 
  Mail,
  MessageSquare,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  BookOpen,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  apiGetAllTeachers, 
  apiCreateTeacher, 
  apiUpdateTeacher, 
  apiDeleteTeacher 
} from "@/services/api/teachers.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import { getCurrentSchoolId } from "@/services/api/client";
import type { Teacher, Subject, Class } from "@/types";
import { useNavigate } from "react-router-dom";

const matieresMocks = ["Mathématiques", "Français", "Sciences Physiques", "SVT", "Histoire-Géo", "Anglais", "Philosophie", "EPS", "Informatique"];

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  hireDate: string;
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [teachersData, subjectsData, classesData] = await Promise.all([
        apiGetAllTeachers(),
        apiGetAllSubjects(),
        apiGetAllClasses()
      ]);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des professeurs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = 
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.matricule.includes(searchTerm);
    
    const matchesSubject = filterSubject === "all" || teacher.subjects.includes(filterSubject);
    const matchesStatus = filterStatus === "all" || teacher.status === filterStatus;
    
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const getRawId = (data: any): string => {
    if (!data) return "";
    return typeof data === "string" ? data : (data.id || data._id || "");
  };

  const getSubjectNames = (subjectIds: any[]) => {
    if (!Array.isArray(subjectIds)) return "Aucune";
    return subjectIds
      .map(item => {
        const id = getRawId(item);
        const subject = subjects.find(s => s.id === id);
        if (subject) return subject.name;
        if (item && typeof item === "object" && item.name) return item.name;
        return id;
      })
      .filter(Boolean)
      .join(", ") || "Aucune";
  };

  const getClassNames = (classIds: any[]) => {
    if (!Array.isArray(classIds)) return "Aucune";
    return classIds
      .map(item => {
        const id = getRawId(item);
        const cls = classes.find(c => c.id === id);
        if (cls) return cls.name;
        if (item && typeof item === "object" && item.name) return item.name;
        return id;
      })
      .filter(Boolean)
      .join(", ") || "Aucune";
  };

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === "active").length,
    inactive: teachers.filter(t => t.status === "inactive").length,
    newThisMonth: 2,
  };

  const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = getCurrentSchoolId();
    const newTeacherData: Omit<Teacher, "id"> = {
      matricule: `TCH-2026-${String(teachers.length + 1).padStart(3, "0")}`,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      subjects: (formData.getAll("subject") as string[]).filter(id => id && id !== ""),
      classes: [],
      hireDate: formData.get("hireDate") as string,
      status: "active",
      schoolId: schoolId || undefined,
    };

    try {
      const createdTeacher = await apiCreateTeacher(newTeacherData);
      setTeachers([...teachers, createdTeacher]);
      setIsDialogOpen(false);
      toast({
        title: "Professeur ajouté",
        description: `${createdTeacher.firstName} ${createdTeacher.lastName} a été ajouté avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le professeur.",
        variant: "destructive",
      });
    }
  };

  const handleEditTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedData: Partial<Teacher> = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      subjects: (formData.getAll("subject") as string[]).filter(id => id && id !== ""),
      status: formData.get("status") as "active" | "inactive",
    };
    
    try {
      const updatedTeacher = await apiUpdateTeacher(selectedTeacher.id, updatedData);
      if (updatedTeacher) {
        setTeachers(teachers.map(t => t.id === selectedTeacher.id ? updatedTeacher : t));
        setIsEditDialogOpen(false);
        setSelectedTeacher(null);
        toast({
          title: "Professeur modifié",
          description: `Les informations de ${updatedTeacher.firstName} ${updatedTeacher.lastName} ont été mises à jour.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le professeur.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    try {
      await apiDeleteTeacher(teacher.id);
      setTeachers(teachers.filter((t) => t.id !== teacher.id));
      toast({
        title: "Professeur supprimé",
        description: `${teacher.firstName} ${teacher.lastName} a été supprimé du système.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le professeur.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "La liste des professeurs est en cours d'exportation...",
    });
  };

  const TeacherForm = ({ onSubmit, defaultValues, submitLabel }: { 
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; 
    defaultValues?: Partial<Teacher>;
    submitLabel: string;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" defaultValue={defaultValues?.lastName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" defaultValue={defaultValues?.firstName} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={defaultValues?.phone} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Matière principale</Label>
          <Select name="subject" defaultValue={defaultValues?.subjects?.[0]}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hireDate">Date d'embauche</Label>
          <Input id="hireDate" name="hireDate" type="date" defaultValue={defaultValues?.hireDate} required />
        </div>
      </div>
      {defaultValues?.status !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select name="status" defaultValue={defaultValues.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );

  const TeacherCard = ({ teacher }: { teacher: Teacher }) => (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono text-muted-foreground">{teacher.matricule}</span>
          <div className="flex items-center gap-2">
            <Badge variant={teacher.status === "active" ? "default" : "secondary"}>
              {teacher.status === "active" ? "Actif" : "Inactif"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSelectedTeacher(teacher); setIsViewDialogOpen(true); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedTeacher(teacher); setIsEditDialogOpen(true); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/dashboard/courses?teacherId=${teacher.id || (teacher as any)._id}`)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Assigner un cours
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(teacher)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {teacher.firstName[0]}{teacher.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{teacher.firstName} {teacher.lastName}</p>
            <p className="text-sm text-muted-foreground">{getSubjectNames(teacher.subjects)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <div>
            <p className="font-medium text-foreground">Classes</p>
            <p>{teacher.classes.length} classe(s)</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Embauché le</p>
            <p>{new Date(teacher.hireDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="ml-auto">
            Voir emploi du temps
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professeurs</h1>
          <p className="text-muted-foreground">Dashboard / Peoples / Teachers Grid</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau professeur</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouveau dossier professeur.
                </DialogDescription>
              </DialogHeader>
              <TeacherForm onSubmit={handleAddTeacher} submitLabel="Ajouter le professeur" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total professeurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-orange-500/10 p-3">
              <UserX className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-sm text-muted-foreground">Inactifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-500/10 p-3">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Teachers Grid</CardTitle>
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
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Matière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  Aucun professeur trouvé.
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Matière(s)</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-mono">{teacher.matricule}</TableCell>
                    <TableCell className="font-medium">{teacher.lastName}</TableCell>
                    <TableCell>{teacher.firstName}</TableCell>
                    <TableCell>{getSubjectNames(teacher.subjects)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.classes.slice(0, 2).map(c => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {classes.find(cls => cls.id === c)?.name || c}
                          </Badge>
                        ))}
                        {teacher.classes.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{teacher.classes.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{teacher.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === "active" ? "default" : "secondary"}>
                        {teacher.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setSelectedTeacher(teacher); setIsViewDialogOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setSelectedTeacher(teacher); setIsEditDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => navigate(`/dashboard/courses?teacherId=${teacher.id || (teacher as any)._id}`)}
                          title="Assigner un cours"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(teacher)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le professeur</DialogTitle>
            <DialogDescription>
              Modifiez les informations du professeur.
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <TeacherForm 
              onSubmit={handleEditTeacher} 
              defaultValues={selectedTeacher}
              submitLabel="Enregistrer les modifications" 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du professeur</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {selectedTeacher.firstName[0]}{selectedTeacher.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedTeacher.firstName} {selectedTeacher.lastName}</h3>
                  <p className="text-muted-foreground">{selectedTeacher.matricule}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Matière(s)</p>
                  <p>{getSubjectNames(selectedTeacher.subjects)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Classes</p>
                  <p>{getClassNames(selectedTeacher.classes) || "Aucune"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Date d'embauche</p>
                  <p>{new Date(selectedTeacher.hireDate).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Statut</p>
                  <Badge variant={selectedTeacher.status === "active" ? "default" : "secondary"}>
                    {selectedTeacher.status === "active" ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Email</p>
                  <p>{selectedTeacher.email}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Téléphone</p>
                  <p>{selectedTeacher.phone}</p>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => navigate(`/dashboard/courses?teacherId=${selectedTeacher.id || (selectedTeacher as any)._id}`)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Assigner un cours
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
