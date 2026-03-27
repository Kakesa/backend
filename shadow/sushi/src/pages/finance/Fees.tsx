import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    Plus,
    Settings,
    BookOpen,
    Trash2,
    Edit3,
    Users,
    AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiCreateFeeDefinition } from "@/services/api/fees.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { Label } from "@/components/ui/label";

export default function FeesManagement() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<any[]>([]);
    const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const classesData = await apiGetAllClasses();
                setClasses(classesData);
            } catch (error) {
                console.error("Failed to fetch classes:", error);
            }
        };
        fetchClasses();
    }, []);

    const handleCreateFee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            amount: Number(formData.get("amount")),
            academicYear: formData.get("academicYear") as string,
            category: formData.get("category") as any,
            targetClasses: (formData.getAll("targetClasses") as string[]).filter(Boolean),
        };

        setIsSubmitting(true);
        try {
            await apiCreateFeeDefinition(data);
            toast({ title: "Frais défini avec succès", description: "Le frais a été attribué aux élèves des classes cibles." });
            setIsAddFeeDialogOpen(false);
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de définir le frais.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configuration des Frais</h1>
                    <p className="text-muted-foreground">Définissez les types de frais scolaires par classe et année.</p>
                </div>
                <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Définir un Frais
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Nouveau type de frais</DialogTitle>
                            <DialogDescription>
                                Les frais créés seront automatiquement appliqués au solde des élèves concernés.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateFee} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Libellé du frais</Label>
                                <Input id="name" name="name" placeholder="Ex: Minerval 1er Trimestre" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Montant (USD)</Label>
                                    <Input id="amount" name="amount" type="number" placeholder="0.00" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="academicYear">Année Scolaire</Label>
                                    <Input id="academicYear" name="academicYear" defaultValue="2025-2026" required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Select name="category" defaultValue="TUITION">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TUITION">Scolarité / Minerval</SelectItem>
                                        <SelectItem value="TRANSPORT">Transport</SelectItem>
                                        <SelectItem value="CANTEEN">Cantine</SelectItem>
                                        <SelectItem value="EXAM">Frais d'Examen</SelectItem>
                                        <SelectItem value="REGISTRATION">Frais d'Inscription</SelectItem>
                                        <SelectItem value="OTHER">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Classes cibles (Laissez vide pour toutes)</Label>
                                <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                                    {classes.map(c => (
                                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                                            <input type="checkbox" name="targetClasses" value={c.id} className="rounded border-gray-300" />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Création en cours..." : "Valider et Appliquer"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Frais de Base (Standard)
                        </CardTitle>
                        <CardDescription>Frais communs à la plupart des classes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: "Minerval Annuel", amount: 450, period: "2025-2026" },
                                { name: "Frais d'Inscription", amount: 50, period: "Une fois" },
                                { name: "Assurance Scolaire", amount: 15, period: "Annuel" }
                            ].map((f, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{f.name}</p>
                                        <p className="text-xs text-muted-foreground">{f.period}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{f.amount} $</p>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Frais Optionnels / Services
                        </CardTitle>
                        <CardDescription>Cantine, transport, et activités extra.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: "Bus Scolaire (Mois)", amount: 30, cat: "Transport" },
                                { name: "Repas Midi (Trimestre)", amount: 120, cat: "Cantine" },
                                { name: "Club Sportif", amount: 25, cat: "Autre" }
                            ].map((f, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{f.name}</p>
                                        <Badge variant="outline" className="text-[10px] uppercase">{f.cat}</Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{f.amount} $</p>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Règles de Facturation</CardTitle>
                    <CardDescription>Informations sur l'application automatique des frais.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-4 p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="text-sm text-blue-800 space-y-2">
                            <p><strong>Note :</strong> Lorsqu'un nouveau frais est défini, il est immédiatement ajouté au compte de chaque élève des classes ciblées.</p>
                            <p>Si aucune classe n'est sélectionnée, le frais s'applique à <strong>tous les élèves de l'école</strong> ayant un statut "ACTIF".</p>
                            <p>Les parents recevront une notification dans leur application dès l'attribution d'un nouveau frais.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
