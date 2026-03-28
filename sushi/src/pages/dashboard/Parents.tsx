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
  Baby,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiGetAllStudents } from "@/services/api/students.api";
import { apiGetAllParents, apiDeleteParent, apiCreateParent, apiUpdateParent, type Parent } from "@/services/api/parents.api";
import { Student } from "@/types";
import { Loader2 } from "lucide-react";

export default function Parents() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [filterRelationship, setFilterRelationship] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [parentsData, studentsData] = await Promise.all([
        apiGetAllParents(),
        apiGetAllStudents()
      ]);
      setParents(parentsData);
      setStudents(studentsData);
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

  const filteredParents = parents.filter((parent) => {
    const lastName = parent.lastName || "";
    const firstName = parent.firstName || "";
    const email = parent.email || "";
    const matricule = parent.matricule || "";
    
    const matchesSearch = 
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRelationship = filterRelationship === "all" || parent.relationship === filterRelationship;
    const matchesStatus = filterStatus === "all" || parent.status === filterStatus;
    
    return matchesSearch && matchesRelationship && matchesStatus;
  });

  const getChildrenNames = (parent: Parent) => {
    if (parent.children && parent.children.length > 0) {
      return parent.children.map(c => c.name).join(", ");
    }
    if (parent.childrenIds && parent.childrenIds.length > 0) {
      return parent.childrenIds.map(id => {
        const student = students.find(s => s.id === id);
        return student ? `${student.firstName} ${student.lastName}` : id;
      }).join(", ");
    }
    return "";
  };

  const stats = {
    total: parents.length,
    active: parents.filter(p => p.status === "active").length,
    inactive: parents.filter(p => p.status === "inactive").length,
    newThisMonth: 3,
  };

  const handleAddParent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newParentData: Partial<Parent> = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      profession: formData.get("profession") as string,
      status: "active",
    };

    try {
      const createdParent = await apiCreateParent(newParentData);
      setParents([...parents, createdParent]);
      setIsDialogOpen(false);
      toast({
        title: "Parent ajouté",
        description: `${createdParent.firstName} ${createdParent.lastName} a été ajouté avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le parent.",
        variant: "destructive",
      });
    }
  };

  const handleEditParent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedParent) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedData: Partial<Parent> = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      profession: formData.get("profession") as string,
      status: formData.get("status") as "active" | "inactive",
    };
    
    try {
      const updatedParent = await apiUpdateParent(selectedParent.id, updatedData);
      setParents(parents.map(p => p.id === selectedParent.id ? updatedParent : p));
      setIsEditDialogOpen(false);
      setSelectedParent(null);
      toast({
        title: "Parent modifié",
        description: `Les informations de ${updatedParent.firstName} ${updatedParent.lastName} ont été mises à jour.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le parent.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (parent: Parent) => {
    try {
      await apiDeleteParent(parent.id);
      setParents(parents.filter((p) => p.id !== parent.id));
      toast({
        title: "Parent supprimé",
        description: `${parent.firstName} ${parent.lastName} a été supprimé du système.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le parent.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "La liste des parents est en cours d'exportation...",
    });
  };

  const ParentForm = ({ onSubmit, defaultValues, submitLabel }: { 
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; 
    defaultValues?: Partial<Parent>;
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
          <Label htmlFor="profession">Profession</Label>
          <Input id="profession" name="profession" defaultValue={defaultValues?.profession} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="relationship">Relation</Label>
          <Select name="relationship" defaultValue={defaultValues?.relationship || "père"}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="père">Père</SelectItem>
              <SelectItem value="mère">Mère</SelectItem>
              <SelectItem value="tuteur">Tuteur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address} />
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

  const ParentCard = ({ parent }: { parent: Parent }) => (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono text-muted-foreground">{parent.matricule || "No SKU"}</span>
          <div className="flex items-center gap-2">
            <Badge variant={parent.status === "active" ? "default" : "secondary"}>
              {parent.status === "active" ? "Actif" : "Inactif"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSelectedParent(parent); setIsViewDialogOpen(true); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedParent(parent); setIsEditDialogOpen(true); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(parent)}>
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
              {parent.firstName[0]}{parent.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{parent.firstName} {parent.lastName}</p>
            <p className="text-sm text-muted-foreground capitalize">{parent.relationship || "Parent"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <div>
            <p className="font-medium text-foreground">Enfant(s)</p>
            <p>{(parent.childrenIds || parent.children || []).length} enfant(s)</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Profession</p>
            <p>{parent.profession || "N/A"}</p>
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
            Voir enfants
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parents</h1>
          <p className="text-muted-foreground">Dashboard / Peoples / Parents Grid</p>
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
                Add Parent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau parent</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouveau dossier parent.
                </DialogDescription>
              </DialogHeader>
              <ParentForm onSubmit={handleAddParent} submitLabel="Ajouter le parent" />
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
              <p className="text-sm text-muted-foreground">Total parents</p>
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
              <Baby className="h-5 w-5 text-blue-500" />
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
            <CardTitle>Parents Grid</CardTitle>
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
              <Select value={filterRelationship} onValueChange={setFilterRelationship}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes relations</SelectItem>
                  <SelectItem value="père">Père</SelectItem>
                  <SelectItem value="mère">Mère</SelectItem>
                  <SelectItem value="tuteur">Tuteur</SelectItem>
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
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredParents.map((parent) => (
                <ParentCard key={parent.id} parent={parent} />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Enfant(s)</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParents.map((parent) => (
                  <TableRow key={parent.id}>
                    <TableCell className="font-mono">{parent.matricule || "-"}</TableCell>
                    <TableCell className="font-medium">{parent.lastName}</TableCell>
                    <TableCell>{parent.firstName}</TableCell>
                    <TableCell className="capitalize">{parent.relationship || "Parent"}</TableCell>
                    <TableCell>
                      <span className="text-sm">{getChildrenNames(parent) || "Aucun"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{parent.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={parent.status === "active" ? "default" : "secondary"}>
                        {parent.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setSelectedParent(parent); setIsViewDialogOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setSelectedParent(parent); setIsEditDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(parent)}
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
            <DialogTitle>Modifier le parent</DialogTitle>
            <DialogDescription>
              Modifiez les informations du parent.
            </DialogDescription>
          </DialogHeader>
          {selectedParent && (
            <ParentForm 
              onSubmit={handleEditParent} 
              defaultValues={selectedParent}
              submitLabel="Enregistrer les modifications" 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du parent</DialogTitle>
          </DialogHeader>
          {selectedParent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {selectedParent.firstName[0]}{selectedParent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedParent.firstName} {selectedParent.lastName}</h3>
                  <p className="text-muted-foreground">{selectedParent.matricule || "Sans matricule"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Relation</p>
                  <p className="capitalize">{selectedParent.relationship || "Non spécifiée"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Profession</p>
                  <p>{selectedParent.profession || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Email</p>
                  <p>{selectedParent.email}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Téléphone</p>
                  <p>{selectedParent.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-muted-foreground">Adresse</p>
                  <p>{selectedParent.address || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-muted-foreground">Enfant(s)</p>
                  <p>{getChildrenNames(selectedParent) || "Aucun enfant enregistré"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Date d'inscription</p>
                  <p>{selectedParent.registrationDate ? new Date(selectedParent.registrationDate).toLocaleDateString("fr-FR") : "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Statut</p>
                  <Badge variant={selectedParent.status === "active" ? "default" : "secondary"}>
                    {selectedParent.status === "active" ? "Actif" : "Inactif"}
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
