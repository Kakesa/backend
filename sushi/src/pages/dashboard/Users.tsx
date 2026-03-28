/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Shield,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  apiGetAllUsers,
  apiUpdateUserStatus,
  apiDeleteUser,
  apiUpdateUser,
} from "@/services/api/users.api";
import {
  apiGetAllRoles,
  apiCreateRole,
  apiUpdateRole,
  apiDeleteRole,
  apiAssignRole,
} from "@/services/api/roles.api";
import { getCurrentSchoolId, setCurrentSchoolId } from "@/services/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Role, Module, Permission, UserWithRole } from "@/types";

const allModules: Module[] = ["students", "teachers", "courses", "grades", "attendance", "messaging", "reports", "settings", "users"];
const allPermissions: Permission[] = ["create", "read", "update", "delete"];

const getModuleLabel = (module: Module): string => {
  const labels: Record<Module, string> = {
    students: "Élèves",
    teachers: "Professeurs",
    courses: "Cours",
    grades: "Notes",
    attendance: "Présences",
    messaging: "Messagerie",
    reports: "Rapports",
    settings: "Paramètres",
    users: "Utilisateurs",
    absences: "Absences",
    competences: "Compétences",
    calendar: "Calendrier",
  };
  return labels[module] || module;
};

const getPermissionLabel = (permission: Permission): string => {
  const labels: Record<Permission, string> = {
    create: "Créer",
    read: "Lire",
    update: "Modifier",
    delete: "Supprimer",
  };
  return labels[permission] || permission;
};

export default function UsersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [rolesState, setRolesState] = useState<Role[]>([]);
  const [usersState, setUsersState] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<Record<Module, Permission[]>>({} as Record<Module, Permission[]>);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([
        apiGetAllRoles(),
        apiGetAllUsers(),
      ]);
      
      setRolesState(rolesData);
      
      // Map users to UserWithRole format
      const mappedUsers: UserWithRole[] = usersData.map((user: { id: string; email: string; name?: string; role?: string; isActive?: boolean; createdAt?: string; lastLogin?: string }) => ({
        id: user.id,
        email: user.email,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        roleId: user.role || '',
        status: user.isActive ? "active" : "inactive",
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || null,
      }));
      
      setUsersState(mappedUsers);
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

  const getRoleById = (roleId: string) => {
    return rolesState.find(r => r.id === roleId);
  };

  const filteredUsers = usersState.filter(
    (user) => {
      const role = getRoleById(user.roleId);
      // Ne pas afficher les superadmins dans la liste
      if (role?.name === 'superadmin') {
        return false;
      }
      return (
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  );

  const initializePermissions = (role?: Role) => {
    const permissions: Record<Module, Permission[]> = {} as Record<Module, Permission[]>;
    allModules.forEach((module) => {
      if (role) {
        const modulePermission = role.permissions.find((p) => p.module === module);
        permissions[module] = modulePermission?.permissions || [];
      } else {
        permissions[module] = [];
      }
    });
    return permissions;
  };

  const handleOpenRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setNewRoleName(role.name);
      setNewRoleDescription(role.description);
      setNewRolePermissions(initializePermissions(role));
    } else {
      setEditingRole(null);
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRolePermissions(initializePermissions());
    }
    setIsRoleDialogOpen(true);
  };

  const togglePermission = (module: Module, permission: Permission) => {
    setNewRolePermissions((prev) => {
      const current = prev[module] || [];
      if (current.includes(permission)) {
        return { ...prev, [module]: current.filter((p) => p !== permission) };
      } else {
        return { ...prev, [module]: [...current, permission] };
      }
    });
  };

  const handleSaveRole = async () => {
    // Try to get schoolId from localStorage first, then from user context
    let schoolId = getCurrentSchoolId();
    
    // If not in localStorage, try to get from authenticated user
    if (!schoolId && user?.schoolId) {
      schoolId = user.schoolId;
      setCurrentSchoolId(user.schoolId); // Save it for future use
    }
    
    if (!schoolId) {
      toast({
        title: "Erreur",
        description: "ID de l'école manquant. Veuillez vous reconnecter.",
        variant: "destructive",
      });
      return;
    }

    const permissions = allModules
      .filter((module) => newRolePermissions[module]?.length > 0)
      .map((module) => ({
        module,
        permissions: newRolePermissions[module],
      }));

    try {
      if (editingRole) {
        await apiUpdateRole(editingRole.id, {
          name: newRoleName,
          permissions,
        });
        toast({ title: "Rôle modifié", description: `Le rôle ${newRoleName} a été mis à jour.` });
      } else {
        await apiCreateRole({
          name: newRoleName,
          description: newRoleDescription,
          schoolId,
          permissions: permissions.map(p => ({
            module: p.module,
            canCreate: p.permissions.includes("create"),
            canRead: p.permissions.includes("read"),
            canUpdate: p.permissions.includes("update"),
            canDelete: p.permissions.includes("delete"),
          })) as any, // Backend expects different format than frontend
        });
        toast({ title: "Rôle créé", description: `Le rôle ${newRoleName} a été créé.` });
      }
      
      await fetchData();
      setIsRoleDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le rôle.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await apiDeleteRole(roleId);
      toast({ title: "Rôle supprimé", variant: "destructive" });
      await fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rôle.",
        variant: "destructive",
      });
    }
  };

  const handleChangeUserRole = async (userId: string, roleId: string) => {
    try {
      await apiAssignRole(userId, roleId);
      toast({ title: "Rôle utilisateur modifié" });
      await fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle utilisateur.",
        variant: "destructive",
      });
    }
  };

  const handleViewUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsViewUserDialogOpen(true);
  };

  const handleEditUser = async (userId: string) => {
    // For now, just show a toast. You can implement a full edit dialog later
    toast({
      title: "Fonctionnalité à venir",
      description: "L'édition d'utilisateur sera bientôt disponible.",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    // Récupérer l'utilisateur à supprimer
    const userToDelete = usersState.find(u => u.id === userId);
    
    // Vérifier si l'utilisateur est un superadmin
    if (userToDelete?.roleId) {
      const role = getRoleById(userToDelete.roleId);
      if (role?.name === 'superadmin') {
        toast({
          title: "Action non autorisée",
          description: "Les superadmins ne peuvent pas être supprimés.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    
    try {
      await apiDeleteUser(userId);
      toast({ title: "Utilisateur supprimé" });
      await fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les utilisateurs et leurs permissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usersState.length}</p>
              <p className="text-sm text-muted-foreground">Utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usersState.filter((u) => u.status === "active").length}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-orange-500/10 p-3">
              <Shield className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rolesState.length}</p>
              <p className="text-sm text-muted-foreground">Rôles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-500/10 p-3">
              <Key className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rolesState.filter((r) => !r.isSystem).length}</p>
              <p className="text-sm text-muted-foreground">Rôles personnalisés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Rôles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des utilisateurs</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const role = getRoleById(user.roleId);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {user.firstName[0]}{user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.roleId}
                            onValueChange={(value) => handleChangeUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {rolesState.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString("fr-FR")
                            : "Jamais"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewUser(user)}
                              title="Voir les détails"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditUser(user.id)}
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Supprimer"
                              disabled={role?.name === 'superadmin'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rôles et Permissions</CardTitle>
                  <CardDescription>Configurez les permissions CRUD par module</CardDescription>
                </div>
                <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => handleOpenRoleDialog()}>
                      <Plus className="h-4 w-4" />
                      Nouveau rôle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingRole ? "Modifier le rôle" : "Créer un nouveau rôle"}
                      </DialogTitle>
                      <DialogDescription>
                        Définissez les permissions pour chaque module
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nom du rôle</Label>
                          <Input
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="Ex: Surveillant"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={newRoleDescription}
                            onChange={(e) => setNewRoleDescription(e.target.value)}
                            placeholder="Description du rôle"
                          />
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-40">Module</TableHead>
                              {allPermissions.map((perm) => (
                                <TableHead key={perm} className="text-center w-24">
                                  {getPermissionLabel(perm)}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allModules.map((module) => (
                              <TableRow key={module}>
                                <TableCell className="font-medium">
                                  {getModuleLabel(module)}
                                </TableCell>
                                {allPermissions.map((perm) => (
                                  <TableCell key={perm} className="text-center">
                                    <Switch
                                      checked={newRolePermissions[module]?.includes(perm) || false}
                                      onCheckedChange={() => togglePermission(module, perm)}
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleSaveRole} disabled={!newRoleName}>
                          {editingRole ? "Enregistrer" : "Créer le rôle"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rolesState.map((role) => (
                  <Card key={role.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                        </div>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            Système
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map((perm) => (
                            <Badge key={perm.module} variant="outline" className="text-xs">
                              {getModuleLabel(perm.module)}
                            </Badge>
                          ))}
                          {role.permissions.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenRoleDialog(role)}
                          disabled={role.isSystem}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              disabled={role.isSystem}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ce rôle ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Les utilisateurs avec ce rôle devront être réassignés.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRole(role.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
