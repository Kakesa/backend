import { useState, useEffect } from "react";
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
    DialogFooter
} from "@/components/ui/dialog";
import {
    Plus,
    Search,
    Filter,
    Download,
    Trash2,
    Receipt,
    FileText,
    Calendar,
    Wallet,
    Tag,
    Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    apiGetAllExpenses,
    apiCreateExpense,
    apiDeleteExpense,
    apiGetExpenseStats
} from "@/services/api/finance.api";
import { Expense, ExpenseCategory } from "@/types/finance.types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
    { value: "SALARY", label: "Salaires", color: "bg-blue-100 text-blue-700" },
    { value: "UTILITIES", label: "Charges (Eau/Elec)", color: "bg-cyan-100 text-cyan-700" },
    { value: "EQUIPMENT", label: "Matériel", color: "bg-purple-100 text-purple-700" },
    { value: "MAINTENANCE", label: "Entretien", color: "bg-orange-100 text-orange-700" },
    { value: "SUPPLIES", label: "Fournitures", color: "bg-pink-100 text-pink-700" },
    { value: "RENT", label: "Loyer", color: "bg-indigo-100 text-indigo-700" },
    { value: "TAXES", label: "Taxes / Impôts", color: "bg-red-100 text-red-700" },
    { value: "OTHER", label: "Autre", color: "bg-gray-100 text-gray-700" },
];

export default function Expenses() {
    const { toast } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState<any[]>([]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const [data, statsData] = await Promise.all([
                apiGetAllExpenses(),
                apiGetExpenseStats()
            ]);
            setExpenses(data);
            setStats(statsData);
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de charger les dépenses.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            description: formData.get("description") as string,
            amount: Number(formData.get("amount")),
            category: formData.get("category") as ExpenseCategory,
            date: formData.get("date") as string,
            note: formData.get("note") as string,
        };

        setSubmitting(true);
        try {
            await apiCreateExpense(data);
            toast({ title: "Dépense ajoutée", description: "La dépense a été enregistrée avec succès." });
            setIsAddDialogOpen(false);
            fetchExpenses();
        } catch (error) {
            toast({ title: "Erreur", description: "Une erreur est survenue lors de l'enregistrement.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette dépense ?")) return;
        try {
            await apiDeleteExpense(id);
            toast({ title: "Dépense supprimée" });
            fetchExpenses();
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Dépenses</h1>
                    <p className="text-muted-foreground">Suivi des coûts opérationnels et justificatifs.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nouvelle Dépense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Ajouter une dépense</DialogTitle>
                            <DialogDescription>Enregistrez une nouvelle sortie d'argent de la caisse.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="description">Libellé / Description</Label>
                                <Input id="description" name="description" placeholder="Ex: Achat fournitures bureau" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Montant (USD)</Label>
                                    <Input id="amount" name="amount" type="number" placeholder="0.00" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Select name="category" defaultValue="OTHER">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="note">Notes additionnelles</Label>
                                <Input id="note" name="note" placeholder="Détails supplémentaires..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting} className="w-full">
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enregistrer la dépense
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((s, idx) => {
                    const info = CATEGORIES.find(c => c.value === s._id) || CATEGORIES[7];
                    return (
                        <Card key={idx}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{info.label}</p>
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="mt-2">
                                    <h3 className="text-2xl font-bold">{s.totalAmount.toLocaleString()} $</h3>
                                    <p className="text-xs text-muted-foreground">{s.count} transactions</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher une dépense..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" />
                                Filtrer
                            </Button>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Exporter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Enregistré par</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Chargement...</TableCell></TableRow>
                            ) : filteredExpenses.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Aucune dépense trouvée.</TableCell></TableRow>
                            ) : filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(expense.date), 'dd MMM yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={CATEGORIES.find(c => c.value === expense.category)?.color}>
                                            {CATEGORIES.find(c => c.value === expense.category)?.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-red-600">-{expense.amount} $</TableCell>
                                    <TableCell className="text-sm">
                                        {(expense.recordedByName ?? [expense.recordedBy?.firstName, expense.recordedBy?.lastName].filter(Boolean).join(" ")) || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Receipt className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteExpense(expense.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
