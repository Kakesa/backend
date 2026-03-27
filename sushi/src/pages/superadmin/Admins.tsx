import React, { useState, useMemo } from "react";
import { 
  UserCog, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail,
  Phone,
  Building2,
  Shield,
  ShieldOff,
  KeyRound,
  Trash2,
  Eye,
  UserPlus,
  Calendar,
  Clock,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { SchoolAdmin } from "@/types/admin.types";
import type { SchoolWithStats } from "@/types/superadmin.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  apiGetAllAdmins, 
  apiToggleAdminStatus, 
  apiDeleteAdmin, 
  apiResetAdminPassword 
} from "@/services/api/admins.api";
import { apiGetAllSchoolsWithStats } from "@/services/api/superadmin.api";
import { showApiErrorToast, showApiSuccessToast } from "@/lib/apiErrorHandler";

const statusConfig = {
  active: { label: "Actif", variant: "default" as const, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  inactive: { label: "Inactif", variant: "secondary" as const, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  suspended: { label: "Suspendu", variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const SuperAdminAdmins: React.FC = () => {
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adminsData, schoolsData] = await Promise.all([
        apiGetAllAdmins(),
        apiGetAllSchoolsWithStats()
      ]);
      setAdmins(adminsData);
      setSchools(schoolsData);
    } catch (error) {
      showApiErrorToast(error, "Chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      const matchesSearch = 
        admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || admin.status === statusFilter;
      const matchesSchool = schoolFilter === "all" || admin.schoolId === schoolFilter;
      
      return matchesSearch && matchesStatus && matchesSchool;
    });
  }, [admins, searchQuery, statusFilter, schoolFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: admins.length,
    active: admins.filter(a => a.status === "active").length,
    inactive: admins.filter(a => a.status === "inactive").length,
    suspended: admins.filter(a => a.status === "suspended").length,
  }), [admins]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleToggleStatus = async (admin: SchoolAdmin) => {
    try {
      await apiToggleAdminStatus(admin.id);
      await loadData();
      showApiSuccessToast(
        admin.status === "active" ? "Admin désactivé" : "Admin activé",
        `${admin.firstName} ${admin.lastName} a été mis à jour.`
      );
    } catch (error) {
      showApiErrorToast(error, "Mise à jour du statut");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;
    setIsActionLoading(true);
    try {
      await apiResetAdminPassword(selectedAdmin.id);
      showApiSuccessToast(
        "Mot de passe réinitialisé",
        `Un email de réinitialisation a été envoyé à ${selectedAdmin.email}.`
      );
      setShowResetPasswordDialog(false);
      setSelectedAdmin(null);
    } catch (error) {
      showApiErrorToast(error, "Réinitialisation mot de passe");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setIsActionLoading(true);
    try {
      await apiDeleteAdmin(selectedAdmin.id);
      await loadData();
      showApiSuccessToast(
        "Admin supprimé",
        `${selectedAdmin.firstName} ${selectedAdmin.lastName} a été supprimé.`
      );
      setShowDeleteDialog(false);
      setSelectedAdmin(null);
    } catch (error) {
      showApiErrorToast(error, "Suppression de l'administrateur");
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Jamais";
    return format(new Date(dateString), "dd MMM yyyy à HH:mm", { locale: fr });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-7 w-7 text-primary" />
            Gestion des Administrateurs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez tous les administrateurs des écoles de la plateforme
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nouvel Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <ShieldOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShieldOff className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.suspended}</p>
                <p className="text-xs text-muted-foreground">Suspendus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou école..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="suspended">Suspendus</SelectItem>
                </SelectContent>
              </Select>
<Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="École" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les écoles</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Liste des Administrateurs ({filteredAdmins.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrateur</TableHead>
                  <TableHead>École</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun administrateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(admin.firstName, admin.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                            <p className="text-xs text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{admin.schoolName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{admin.email}</span>
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{admin.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[admin.status].className}>
                          {statusConfig[admin.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(admin.lastLogin)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDetailsDialog(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                              {admin.status === "active" ? (
                                <>
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedAdmin(admin);
                              setShowResetPasswordDialog(true);
                            }}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Réinitialiser mot de passe
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de l'administrateur</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedAdmin.firstName, selectedAdmin.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedAdmin.firstName} {selectedAdmin.lastName}
                  </h3>
                  <Badge className={statusConfig[selectedAdmin.status].className}>
                    {statusConfig[selectedAdmin.status].label}
                  </Badge>
                </div>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedAdmin.email}</span>
                </div>
                {selectedAdmin.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedAdmin.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedAdmin.schoolName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Créé le {formatDate(selectedAdmin.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Dernière connexion: {formatDate(selectedAdmin.lastLogin)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
            <AlertDialogDescription>
              Un email de réinitialisation sera envoyé à {selectedAdmin?.email}.
              L'administrateur devra créer un nouveau mot de passe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button onClick={handleResetPassword} disabled={isActionLoading}>
              {isActionLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer l'email
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'administrateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedAdmin?.firstName} {selectedAdmin?.lastName}?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button 
              onClick={handleDeleteAdmin}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdminAdmins;
