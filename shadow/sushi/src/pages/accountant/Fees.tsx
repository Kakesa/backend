/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Filter,
  Download,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { 
  apiGetAllFeeStatuses, 
  apiSendFeeReminder,
  apiRecordPayment,
  StudentFee
} from "@/services/api/fees.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { Label } from "@/components/ui/label";

export default function AccountantFees() {
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
      console.error("Failed to load fees:", error);
      toast.error("Impossible de charger les données financières.");
    } finally {
      setIsLoading(false);
    }
  }, [filterClass, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendReminder = async (id: string) => {
    try {
      await apiSendFeeReminder(id);
      toast.success("Rappel envoyé", {
          description: "Le parent a été notifié."
      });
      fetchData();
    } catch (error) {
      toast.error("Impossible d'envoyer le rappel.");
    }
  };

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
      toast.success("Paiement enregistré");
      setIsPayDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Vérifiez le montant ou le solde.");
    }
  };

  const filteredFees = fees.filter(f => 
    f.studentId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.studentId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.studentId?.matricule?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID": return <Badge className="bg-green-500 hover:bg-green-600 font-normal"><CheckCircle2 className="w-3 h-3 mr-1" /> En règle</Badge>;
      case "PARTIAL": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-normal"><Clock className="w-3 h-3 mr-1" /> Partiel</Badge>;
      case "UNPAID": return <Badge variant="destructive" className="font-normal"><AlertCircle className="w-3 h-3 mr-1" /> Non payé</Badge>;
      default: return <Badge variant="outline" className="font-normal">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suivi des Frais</h1>
          <p className="text-muted-foreground">Consultez l'état des paiements par élève et relancez les parents.</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nom, matricule)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[180px] h-10">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PAID">En règle</SelectItem>
                  <SelectItem value="PARTIAL">Partiel</SelectItem>
                  <SelectItem value="UNPAID">Non payé</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => fetchData()}>
                  <Clock className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="py-4">Élève</TableHead>
                  <TableHead className="py-4">Frais</TableHead>
                  <TableHead className="py-4">Total ($)</TableHead>
                  <TableHead className="py-4">Payé ($)</TableHead>
                  <TableHead className="py-4 text-destructive font-semibold">Solde ($)</TableHead>
                  <TableHead className="py-4">Statut</TableHead>
                  <TableHead className="py-4 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/> Chargement...</TableCell></TableRow>
                ) : filteredFees.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">Aucun enregistrement trouvé.</TableCell></TableRow>
                ) : filteredFees.map((fee) => (
                  <TableRow key={fee.id} className="hover:bg-accent/50 transition-colors border-b">
                    <TableCell className="py-4">
                      <div className="font-semibold text-foreground">{fee.studentId?.firstName} {fee.studentId?.lastName}</div>
                      <div className="text-xs text-muted-foreground">{fee.studentId?.matricule} • {fee.studentId?.classId?.name || "Sans classe"}</div>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium">{fee.feeDefinitionId?.name}</TableCell>
                    <TableCell className="py-4 font-mono font-medium">{fee.totalAmount}</TableCell>
                    <TableCell className="py-4 font-mono font-medium text-green-600">+{fee.amountPaid}</TableCell>
                    <TableCell className="py-4 font-mono font-bold text-destructive">-{fee.balance}</TableCell>
                    <TableCell className="py-4">{getStatusBadge(fee.status)}</TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Dialog open={isPayDialogOpen && selectedFee?.id === fee.id} onOpenChange={(open) => {
                          if (!open) { setSelectedFee(null); setIsPayDialogOpen(false); }
                          else { setSelectedFee(fee); setIsPayDialogOpen(true); }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={fee.status === "PAID"}
                              className="h-9 px-3 border-primary/20 hover:border-primary/50 text-xs font-semibold"
                            >
                              <Banknote className="w-3.5 h-3.5 mr-1.5" /> Encaisser
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Enregistrer un paiement</DialogTitle>
                              <DialogDescription>
                                Enregistrez un versement pour <strong>{fee.studentId?.firstName} {fee.studentId?.lastName}</strong>.
                                <br />Reste à payer : <strong className="text-destructive">{fee.balance} $</strong>
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handlePayment} className="space-y-4 pt-4">
                              <div className="grid gap-2">
                                <Label htmlFor="amount">Montant du versement (USD)</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={fee.balance} max={fee.balance} required />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="method">Mode de paiement</Label>
                                <Select name="method" defaultValue="CASH">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Virement Bancaire</SelectItem>
                                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                    <SelectItem value="CREDIT_CARD">Carte</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="reference">Référence transaction</Label>
                                <Input id="reference" name="reference" placeholder="N° Bordereau, Recu, etc." />
                              </div>
                              <Button type="submit" className="w-full h-11">Valider le versement</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          title="Envoyer un rappel au parent"
                          onClick={() => handleSendReminder(fee.id)}
                          disabled={fee.status === "PAID"}
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v4" />
    <path d="m16.2 7.8 2.9-2.9" />
    <path d="M18 12h4" />
    <path d="m16.2 16.2 2.9 2.9" />
    <path d="M12 18v4" />
    <path d="m4.9 19.1 2.9-2.9" />
    <path d="M2 12h4" />
    <path d="m4.9 4.9 2.9 2.9" />
  </svg>
);
