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
    Search,
    Plus,
    CheckCircle2,
    AlertCircle,
    Clock,
    Filter,
    Download,
    Banknote,
    Users,
    Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    apiGetAllFeeStatuses,
    apiRecordPayment,
    StudentFee
} from "@/services/api/fees.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export default function Payments() {
    const { toast } = useToast();
    const [fees, setFees] = useState<StudentFee[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterClass, setFilterClass] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [feesData, classesData] = await Promise.all([
                apiGetAllFeeStatuses({
                    classId: filterClass !== "all" ? filterClass : undefined,
                    status: filterStatus !== "all" ? filterStatus : undefined
                }),
                apiGetAllClasses(),
            ]);
            setFees(feesData);
            setClasses(classesData);
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de charger les paiements.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [filterClass, filterStatus, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedFee) return;
        const formData = new FormData(e.currentTarget);
        const data = {
            studentFeeId: selectedFee.id,
            amount: Number(formData.get("amount")),
            method: formData.get("method") as string,
            reference: formData.get("reference") as string,
        };

        try {
            await apiRecordPayment(data);
            toast({ title: "Paiement enregistré" });
            setIsPayDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Erreur", description: "Vérifiez le montant ou le solde.", variant: "destructive" });
        }
    };

    const filteredFees = fees.filter(f =>
        f.studentId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.studentId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.studentId?.matricule?.includes(searchTerm)
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID": return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> En règle</Badge>;
            case "PARTIAL": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200"><Clock className="w-3 h-3 mr-1" /> Partiel</Badge>;
            case "UNPAID": return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Non payé</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Paiements</h1>
                    <p className="text-muted-foreground">Suivi individuel et encaissement des frais.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter la liste
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par élève ou matricule..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger className="w-[150px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Classe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="PAID">En règle</SelectItem>
                                    <SelectItem value="PARTIAL">Partiel</SelectItem>
                                    <SelectItem value="UNPAID">Non payé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Élève</TableHead>
                                <TableHead>Libellé</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Payé</TableHead>
                                <TableHead>Solde</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-10">Chargement...</TableCell></TableRow>
                            ) : filteredFees.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-10">Aucun paiement trouvé.</TableCell></TableRow>
                            ) : filteredFees.map((fee) => (
                                <TableRow key={fee.id}>
                                    <TableCell>
                                        <div className="font-medium">{fee.studentId?.firstName} {fee.studentId?.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{fee.studentId?.matricule} • {fee.studentId?.class?.name}</div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{fee.feeDefinitionId?.name}</TableCell>
                                    <TableCell className="font-mono">{fee.totalAmount} $</TableCell>
                                    <TableCell className="font-mono text-green-600">{fee.amountPaid} $</TableCell>
                                    <TableCell className="font-mono text-destructive font-bold">{fee.balance} $</TableCell>
                                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={fee.status === "PAID"}
                                                onClick={() => { setSelectedFee(fee); setIsPayDialogOpen(true); }}
                                            >
                                                <Banknote className="w-4 h-4 mr-1" /> Payer
                                            </Button>
                                            <Link to={`/finance/student/${fee.studentId?._id || fee.studentId?.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" /> Détails
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Enregistrer un paiement</DialogTitle>
                        <DialogDescription>
                            Versement pour {selectedFee?.studentId?.firstName} {selectedFee?.studentId?.lastName}.
                            <br />Solde restant : <strong>{selectedFee?.balance} $</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment} className="space-y-4 pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pay_amount">Montant du versement</Label>
                            <Input id="pay_amount" name="amount" type="number" defaultValue={selectedFee?.balance} max={selectedFee?.balance} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="method">Mode de paiement</Label>
                            <Select name="method" defaultValue="CASH">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Virement</SelectItem>
                                    <SelectItem value="MOBILE_MONEY">M-Pesa / Mobile</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reference">Référence transaction</Label>
                            <Input id="reference" name="reference" placeholder="Ex: N° Bordereau" />
                        </div>
                        <Button type="submit" className="w-full">Valider</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
