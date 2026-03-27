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
  BookOpen,
  Loader2,
  Trash2,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  apiGetAllSubjects, 
  apiCreateSubject, 
  apiUpdateSubject, 
  apiDeleteSubject 
} from "@/services/api/subjects.api";
import { getCurrentSchoolId, setCurrentSchoolId } from "@/services/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Subject, CreateSubjectDTO } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { value: "scientifique", label: "Scientifique" },
  { value: "litteraire", label: "Littéraire" },
  { value: "artistique", label: "Artistique" },
  { value: "sportif", label: "Sportif" },
];

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Subject["category"]>("scientifique");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGetAllSubjects();
      setSubjects(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les matières.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    // Sauvegarder dans localStorage si on l'a récupéré du user
    if (!getCurrentSchoolId() && user?.schoolId) {
      setCurrentSchoolId(user.schoolId);
    }

    const subjectData: CreateSubjectDTO = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      coefficient: Number(formData.get("coefficient")),
      category: selectedCategory,
      schoolId: schoolId,
    };

    try {
      if (editingSubject) {
        const updated = await apiUpdateSubject(editingSubject.id, subjectData);
        if (updated) {
          setSubjects(subjects.map((s) => (s.id === updated.id ? updated : s)));
          toast({ title: "Matière mise à jour" });
        }
      } else {
        const created = await apiCreateSubject(subjectData);
        setSubjects([...subjects, created]);
        toast({ title: "Matière créée" });
      }
      setIsDialogOpen(false);
      setEditingSubject(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteSubject(id);
      setSubjects(subjects.filter((s) => s.id !== id));
      toast({
        title: "Matière supprimée",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la matière.",
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      scientifique: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      litteraire: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      artistique: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
      sportif: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return (
      <Badge className={colors[category] || "bg-gray-100 text-gray-800"}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Matières</h1>
          <p className="text-muted-foreground">Configurez les matières enseignées dans votre école</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingSubject(null);
            setSelectedCategory("scientifique");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle matière
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Modifier la matière" : "Créer une matière"}</DialogTitle>
              <DialogDescription>
                Remplissez les détails ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la matière</Label>
                <Input id="name" name="name" defaultValue={editingSubject?.name} required placeholder="Ex: Mathématiques" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" defaultValue={editingSubject?.code} required placeholder="Ex: MATH-01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coefficient">Coefficient</Label>
                  <Input id="coefficient" name="coefficient" type="number" defaultValue={editingSubject?.coefficient || 1} min={1} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as any)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingSubject ? "Mettre à jour" : "Créer la matière"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingSubject(subject);
                          setSelectedCategory(subject.category);
                          setIsDialogOpen(true);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(subject.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardTitle className="mt-3">{subject.name}</CardTitle>
                <CardDescription>Code: {subject.code}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coefficient</span>
                  <span className="font-bold">{subject.coefficient}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Catégorie</span>
                  {getCategoryBadge(subject.category)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Aucune matière trouvée.
          </div>
        )}
      </div>
    </div>
  );
}
