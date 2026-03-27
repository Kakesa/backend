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
  MapPin,
  Loader2,
  Trash2,
  MoreVertical,
  Pencil,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  apiGetAllRooms, 
  apiCreateRoom, 
  apiUpdateRoom, 
  apiDeleteRoom 
} from "@/services/api/schedule.api";
import { getCurrentSchoolId, setCurrentSchoolId } from "@/services/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Room } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roomTypes = [
  { value: "classroom", label: "Classe" },
  { value: "lab", label: "Laboratoire" },
  { value: "gym", label: "Gymnase" },
  { value: "auditorium", label: "Auditorium" },
];

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedType, setSelectedType] = useState<Room["type"]>("classroom");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!getCurrentSchoolId() && user?.schoolId) {
        setCurrentSchoolId(user.schoolId);
      }
      const data = await apiGetAllRooms();
      setRooms(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les salles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
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

    if (!getCurrentSchoolId() && user?.schoolId) {
      setCurrentSchoolId(user.schoolId);
    }

    const roomData: any = {
      name: formData.get("name") as string,
      capacity: Number(formData.get("capacity")),
      type: selectedType,
      available: true,
      schoolId: schoolId,
    };

    try {
      if (editingRoom) {
        const updated = await apiUpdateRoom(editingRoom.id, roomData);
        if (updated) {
          setRooms(rooms.map((r) => (r.id === updated.id ? updated : r)));
          toast({ title: "Salle mise à jour" });
        }
      } else {
        const created = await apiCreateRoom(roomData);
        setRooms([...rooms, created]);
        toast({ title: "Salle créée" });
      }
      setIsDialogOpen(false);
      setEditingRoom(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) return;
    try {
      await apiDeleteRoom(id);
      setRooms(rooms.filter((r) => r.id !== id));
      toast({
        title: "Salle supprimée",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la salle.",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      classroom: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      lab: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      gym: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      auditorium: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    };
    const label = roomTypes.find(t => t.value === type)?.label || type;
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Salles</h1>
          <p className="text-muted-foreground">Configurez les salles disponibles dans votre établissement</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingRoom(null);
            setSelectedType("classroom");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle salle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Modifier la salle" : "Créer une salle"}</DialogTitle>
              <DialogDescription>
                Remplissez les détails ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la salle</Label>
                <Input id="name" name="name" defaultValue={editingRoom?.name} required placeholder="Ex: Salle 101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité (personnes)</Label>
                <Input id="capacity" name="capacity" type="number" defaultValue={editingRoom?.capacity || 30} min={1} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type de salle</Label>
                <Select value={selectedType} onValueChange={(val) => setSelectedType(val as any)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingRoom ? "Mettre à jour" : "Créer la salle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom..."
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
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <Card key={room.id} className="transition-shadow hover:shadow-lg relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
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
                          setEditingRoom(room);
                          setSelectedType(room.type);
                          setIsDialogOpen(true);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(room.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardTitle className="mt-3">{room.name}</CardTitle>
                <CardDescription>
                  {roomTypes.find(t => t.value === room.type)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Capacité
                  </span>
                  <span className="font-bold">{room.capacity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  {getTypeBadge(room.type)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Aucune salle trouvée.
          </div>
        )}
      </div>
    </div>
  );
}
