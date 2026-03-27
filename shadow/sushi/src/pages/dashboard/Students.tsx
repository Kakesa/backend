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
  GraduationCap,
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
  apiGetAllStudents, 
  apiCreateStudent, 
  apiUpdateStudent, 
  apiDeleteStudent 
} from "@/services/api/students.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { getCurrentSchoolId } from "@/services/api/client";
import { apiCreateParent, apiUpdateParent } from "@/services/api/parents.api";
import { apiCreateUser } from "@/services/api/users.api";
import { apiCreateNotification } from "@/services/api/notifications.api";
import { apiSendEmailNotification } from "@/services/api/superadmin.api";
import type { Student, Class } from "@/types";

interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentRelation: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsData, classesData] = await Promise.all([
        apiGetAllStudents(),
        apiGetAllClasses()
      ]);
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricule.includes(searchTerm);
    
    // Use classId from student
    const matchesClass = filterClass === "all" || student.classId === filterClass;
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  const getClassName = (student: Student) => {
    const cls = classes.find(c => c.id === student.classId);
    return cls?.name || "N/A";
  };

  const getStudentClassId = (student: Student): string => {
    return student.classId || "";
  };

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === "ACTIVE").length,
    inactive: students.filter(s => s.status === "INACTIVE").length,
    newThisMonth: 0,
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = getCurrentSchoolId();
    const splitParentName = (fullName: string) => {
      const parts = fullName.split(" ");
      return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || parts[0],
      };
    };

    const parentName = formData.get("parentName") as string;
    const { firstName: pFirst, lastName: pLast } = splitParentName(parentName);

    const newStudentData: any = {
      matricule: `STD-2026-${String(students.length + 1).padStart(3, "0")}`,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      gender: formData.get("gender") as "MALE" | "FEMALE" | "OTHER",
      address: formData.get("address") as string,
      classId: formData.get("classId") as string,
      parentName: parentName,
      parentPhone: formData.get("parentPhone") as string,
      parentEmail: formData.get("parentEmail") as string,
      parentFirstName: pFirst,
      parentLastName: pLast,
      parentRelation: formData.get("parentRelation") as string,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      schoolId: schoolId || undefined,
    };

    try {
      const createdStudent = await apiCreateStudent(newStudentData);

      // If parent email provided, create parent record, user account and send an in-app invitation
      if (newStudentData.parentEmail) {
        try {
          const parentPayload: any = {
            firstName: newStudentData.parentFirstName,
            lastName: newStudentData.parentLastName,
            email: newStudentData.parentEmail,
            phone: newStudentData.parentPhone,
            relationship: newStudentData.parentRelation,
            childrenIds: [createdStudent.id],
            schoolId: newStudentData.schoolId,
            registrationDate: new Date().toISOString(),
            status: 'active',
          };

          const createdParent = await apiCreateParent(parentPayload);

          const defaultPassword = "123456";
          const userPayload: any = {
            email: createdParent.email || newStudentData.parentEmail,
            password: defaultPassword,
            role: "parent",
            linkedId: createdParent.id,
            firstName: createdParent.firstName || newStudentData.parentFirstName,
            lastName: createdParent.lastName || newStudentData.parentLastName,
            phone: createdParent.phone || newStudentData.parentPhone,
          };

          const createdUser = await apiCreateUser(userPayload as any);

          // Try to link user id back to parent record
          try {
            await apiUpdateParent(createdParent.id, { userId: createdUser.id } as any);
          } catch (e) {
            // non blocking
          }

          // Create an in-app notification containing the default password and link to change-password
          try {
            const message = `Vous êtes invité à rejoindre l'école. 
            Email: ${createdUser.email}. Mot de passe par défaut: ${defaultPassword}. 
            Merci de changer votre mot de passe ici: ${window.location.origin}/change-password`;
            await apiCreateNotification({
              type: "message",
              title: "Invitation à rejoindre l'école",
              message,
              recipientId: createdUser.id,
              recipientType: "parent",
              priority: "medium",
              link: "/change-password",
            } as any);
          } catch (e) {
            // non blocking
          }

          // Send email invitation with default password and change-password link
          try {
            const emailBody = `Bonjour ${createdParent.firstName || newStudentData.parentFirstName},\n\nVous êtes invité à rejoindre l'école Scholar Buddy.\n\nVos identifiants de connexion :\nEmail: ${createdUser.email}\nMot de passe par défaut: ${defaultPassword}\n\nPour accéder à votre compte et changer votre mot de passe, cliquez sur le lien suivant:\n${window.location.origin}/change-password\n\nNous vous recommendons de changer votre mot de passe dès votre première connexion.\n\nCordialement,\nL'équipe Scholar Buddy`;
            
            await apiSendEmailNotification({
              to: createdUser.email,
              subject: "Invitation à rejoindre Scholar Buddy",
              body: emailBody,
              type: "account_activation",
            });
          } catch (e) {
            // non blocking - email send failure shouldn't block the process
            console.error("Email send failed:", e);
          }

          toast({
            title: "Invitation créée",
            description: `Invitation créée pour le parent (${createdParent.email || newStudentData.parentEmail}).`,
          });
        } catch (err) {
          toast({
            title: "Attention",
            description: "L'élève a été créé mais l'invitation du parent a échoué.",
            variant: "destructive",
          });
        }
      }

      setStudents([...students, createdStudent]);
      setIsDialogOpen(false);
      toast({
        title: "Élève ajouté",
        description: `${createdStudent.firstName} ${createdStudent.lastName} a été inscrit avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'élève.",
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedData: Partial<Student> = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      gender: formData.get("gender") as "MALE" | "FEMALE" | "OTHER",
      address: formData.get("address") as string,
      classId: formData.get("classId") as string,
      parentName: formData.get("parentName") as string,
      parentPhone: formData.get("parentPhone") as string,
      status: formData.get("status") as "ACTIVE" | "INACTIVE",
    } as any;
    
    try {
      const updatedStudent = await apiUpdateStudent(selectedStudent.id, updatedData);
      if (updatedStudent) {
        setStudents(students.map(s => s.id === selectedStudent.id ? updatedStudent : s));
        setIsEditDialogOpen(false);
        setSelectedStudent(null);
        toast({
          title: "Élève modifié",
          description: `Les informations de ${updatedStudent.firstName} ${updatedStudent.lastName} ont été mises à jour.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'élève.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (student: Student) => {
    try {
      await apiDeleteStudent(student.id);
      setStudents(students.filter((s) => s.id !== student.id));
      toast({
        title: "Élève supprimé",
        description: `${student.firstName} ${student.lastName} a été supprimé du système.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élève.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "La liste des élèves est en cours d'exportation...",
    });
  };

  const StudentForm = ({ onSubmit, defaultValues, submitLabel }: { 
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; 
    defaultValues?: any;
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
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={defaultValues?.phone} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date de naissance</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaultValues?.dateOfBirth ? new Date(defaultValues.dateOfBirth).toISOString().split('T')[0] : ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Sexe</Label>
          <Select name="gender" defaultValue={defaultValues?.gender || "MALE"}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Masculin</SelectItem>
              <SelectItem value="FEMALE">Féminin</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="classId">Classe</Label>
        <Select name="classId" defaultValue={defaultValues ? getStudentClassId(defaultValues) : ""}>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentName">Nom complet du parent</Label>
          <Input id="parentName" name="parentName" defaultValue={defaultValues?.parentName} placeholder="Ex: Jean Dupont" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentEmail">Email du parent</Label>
          <Input id="parentEmail" name="parentEmail" type="email" defaultValue={defaultValues?.parentEmail} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentPhone">Tél. parent</Label>
          <Input id="parentPhone" name="parentPhone" type="tel" defaultValue={defaultValues?.parentPhone} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentRelation">Relation</Label>
          <Select name="parentRelation" defaultValue={defaultValues?.parentRelation || "PÈRE"}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PÈRE">Père</SelectItem>
              <SelectItem value="MÈRE">Mère</SelectItem>
              <SelectItem value="TUTEUR">Tuteur</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="INACTIVE">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );

  const StudentCard = ({ student }: { student: Student }) => (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono text-muted-foreground">{student.matricule}</span>
          <div className="flex items-center gap-2">
            <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
              {student.status === "ACTIVE" ? "Actif" : "Inactif"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setIsViewDialogOpen(true); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setIsEditDialogOpen(true); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(student)}>
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
              {student.firstName[0]}{student.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{student.firstName} {student.lastName}</p>
            <p className="text-sm text-muted-foreground">{getClassName(student)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
          <div>
            <p className="font-medium text-foreground">N° Matricule</p>
            <p>{student.matricule}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Sexe</p>
            <p>{student.gender === "MALE" ? "Masculin" : student.gender === "FEMALE" ? "Féminin" : "Autre"}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Inscrit le</p>
            <p>{new Date(student.enrollmentDate).toLocaleDateString("fr-FR")}</p>
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
            Voir bulletin
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Élèves</h1>
          <p className="text-muted-foreground">Dashboard / Peoples / Students Grid</p>
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
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Inscrire un nouvel élève</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouveau dossier élève.
                </DialogDescription>
              </DialogHeader>
              <StudentForm onSubmit={handleAddStudent} submitLabel="Inscrire l'élève" />
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
              <p className="text-sm text-muted-foreground">Total élèves</p>
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
              <GraduationCap className="h-5 w-5 text-blue-500" />
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
            <CardTitle>Students Grid</CardTitle>
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
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
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
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  Aucun élève trouvé.
                </div>
              )}
            </div>
          ) : (
            <>
              {filteredStudents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Sexe</TableHead>
                      <TableHead>Contact Parent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono">{student.matricule}</TableCell>
                        <TableCell className="font-medium">{student.lastName}</TableCell>
                        <TableCell>{student.firstName}</TableCell>
                        <TableCell>{getClassName(student)}</TableCell>
                        <TableCell>{student.gender === "MALE" ? "Masculin" : student.gender === "FEMALE" ? "Féminin" : "Autre"}</TableCell>
                        <TableCell>{student.parentPhone}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                            {student.status === "ACTIVE" ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => { setSelectedStudent(student); setIsViewDialogOpen(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => { setSelectedStudent(student); setIsEditDialogOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(student)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Aucun élève trouvé.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'élève</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'élève.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <StudentForm 
              onSubmit={handleEditStudent} 
              defaultValues={selectedStudent}
              submitLabel="Enregistrer les modifications" 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l'élève</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-muted-foreground">{selectedStudent.matricule}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Classe</p>
                  <p>{getClassName(selectedStudent)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Sexe</p>
                  <p>{selectedStudent.gender === "MALE" ? "Masculin" : selectedStudent.gender === "FEMALE" ? "Féminin" : "Autre"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Date de naissance</p>
                  <p>{new Date(selectedStudent.dateOfBirth).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Date d'inscription</p>
                  <p>{new Date(selectedStudent.enrollmentDate).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Email</p>
                  <p>{selectedStudent.email || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Téléphone</p>
                  <p>{selectedStudent.phone || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-muted-foreground">Adresse</p>
                  <p>{selectedStudent.address}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Parent</p>
                  <p>{selectedStudent.parentName}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Tél. parent</p>
                  <p>{selectedStudent.parentPhone}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Statut</p>
                  <Badge variant={selectedStudent.status === "ACTIVE" ? "default" : "secondary"}>
                    {selectedStudent.status === "ACTIVE" ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
