import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    ArrowLeft,
    CreditCard,
    History,
    User,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
    Printer,
    Download,
    Loader2,
    DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGetStudentFees } from "@/services/api/fees.api";
import { apiGetStudentById } from "@/services/api/students.api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function StudentFinanceDetail() {
    const { id } = useParams();
    const { toast } = useToast();
    const [student, setStudent] = useState<any>(null);
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const [studentData, feesData] = await Promise.all([
                    apiGetStudentById(id),
                    apiGetStudentFees(id)
                ]);
                setStudent(studentData ?? null);
                setFees(feesData);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger le dossier financier.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, toast]);

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!student) return <div>Élève introuvable</div>;

    const totalToPay = fees.reduce((acc, f) => acc + f.totalAmount, 0);
    const totalPaid = fees.reduce((acc, f) => acc + f.amountPaid, 0);
    const balance = totalToPay - totalPaid;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID": return <Badge className="bg-green-500 hover:bg-green-600">Payé</Badge>;
            case "PARTIAL": return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Partiel</Badge>;
            case "UNPAID": return <Badge variant="destructive">Impayé</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/finance/payments">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{student.firstName} {student.lastName}</h1>
                    <p className="text-muted-foreground">Matricule: {student.matricule} • Classe: {student.class?.name}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline"><Printer className="h-4 w-4 mr-2" /> Imprimer Relevé</Button>
                    <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Exporter PDF</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Scolarité Totale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalToPay.toLocaleString()} $</div>
                        <p className="text-xs text-muted-foreground mt-1">Année scolaire en cours</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 border-green-100/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Montant Versé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} $</div>
                        <p className="text-xs text-muted-foreground mt-1">Recettes perçues</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50/50 border-red-100/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Solde Restant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{balance.toLocaleString()} $</div>
                        <p className="text-xs text-muted-foreground mt-1 text-red-600/70">À recouvrer</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CreditCard className="h-5 w-5" />
                            État des Frais
                        </CardTitle>
                        <CardDescription>Détail par catégorie de frais</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Frais</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Payé</TableHead>
                                    <TableHead>Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fees.map((f: any) => (
                                    <TableRow key={f.id}>
                                        <TableCell className="font-medium text-sm">{f.feeDefinitionId?.name}</TableCell>
                                        <TableCell className="text-sm">{f.totalAmount} $</TableCell>
                                        <TableCell className="text-sm">{f.amountPaid} $</TableCell>
                                        <TableCell>{getStatusBadge(f.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <History className="h-5 w-5" />
                            Historique des Versements
                        </CardTitle>
                        <CardDescription>Toutes les transactions effectuées</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {fees.flatMap(f => f.payments || []).sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map((p: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{p.amount} $</p>
                                            <p className="text-xs text-muted-foreground">{p.method} • {p.reference || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium">{format(new Date(p.paymentDate), 'dd/MM/yyyy', { locale: fr })}</p>
                                        <p className="text-[10px] text-muted-foreground">Recu #{p.id.substring(0, 6).toUpperCase()}</p>
                                    </div>
                                </div>
                            ))}
                            {fees.every(f => !f.payments?.length) && (
                                <p className="text-center text-muted-foreground py-10">Aucun versement enregistré.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
