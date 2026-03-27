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
  Wallet, 
  Search, 
  Plus, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Filter,
  Download,
  MoreVertical,
  Banknote,
  Percent,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  apiCreateFeeDefinition, 
  apiGetAllFeeStatuses, 
  apiSendFeeReminder,
  apiRecordPayment,
  StudentFee
} from "@/services/api/fees.api";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { Label } from "@/components/ui/label";

export default function Fees() {
  const { toast } = useToast();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalPaid: 0,
    enRegle: 0,
    enRetard: 0,
  });

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

      // Simple stats calculation
      const totalExp = feesData.reduce((acc, f) => acc + f.totalAmount, 0);
      const totalPd = feesData.reduce((acc, f) => acc + f.amountPaid, 0);
      const regle = feesData.filter(f => f.status === "PAID").length;
      const retard = feesData.filter(f => f.status === "UNPAID" || f.status === "PARTIAL").length;

      setStats({
        totalExpected: totalExp,
        totalPaid: totalPd,
        enRegle: regle,
        enRetard: retard,
      });

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterClass, filterStatus, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendReminder = async (id: string) => {
    try {
      await apiSendFeeReminder(id);
      toast({
        title: "Rappel envoyé",
        description: "L'élève/parent a été notifié.",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le rappel.",
        variant: "destructive",
      });
    }
  };

  const handleAddFee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      academicYear: formData.get("academicYear") as string,
      category: formData.get("category") as any,
      targetClasses: (formData.getAll("targetClasses") as string[]).filter(Boolean),
    };

    try {
      await apiCreateFeeDefinition(data);
      toast({ title: "Frais créé et attribué" });
      setIsAddFeeDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
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
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Frais Scolaires</h1>
          <p className="text-muted-foreground">Suivi des paiements, rappels et états financiers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau Frais
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Définir un nouveau frais</DialogTitle>
                <DialogDescription>
                  Ce frais sera automatiquement attribué aux élèves des classes sélectionnées.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddFee} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom du frais</Label>
                  <Input id="name" name="name" placeholder="Ex: Minerval Trimestre 1" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Montant (USD)</Label>
                    <Input id="amount" name="amount" type="number" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="academicYear">Année Scolaire</Label>
                    <Input id="academicYear" name="academicYear" placeholder="2025-2026" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select name="category" defaultValue="TUITION">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUITION">Scolarité (Minerval)</SelectItem>
                      <SelectItem value="TRANSPORT">Transport</SelectItem>
                      <SelectItem value="CANTEEN">Cantine</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Classes concernées (Laissez vide pour toutes)</Label>
                  <select 
                    name="targetClasses" 
                    multiple 
                    className="w-full h-24 border rounded-md p-2 text-sm bg-background focus:ring-2 focus:ring-primary"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full">Créer et attribuer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenu Attendu</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpected.toLocaleString()} $</div>
            <p className="text-xs text-muted-foreground text-blue-600">Total des frais attribués</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalPaid.toLocaleString()} $</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${(stats.totalPaid / (stats.totalExpected || 1)) * 100}%` }} 
                />
              </div>
              <span className="text-xs font-medium">{Math.round((stats.totalPaid / (stats.totalExpected || 1)) * 100)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Élèves en Règle</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enRegle}</div>
            <p className="text-xs text-muted-foreground">Paiement total effectué</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impayés / Partiels</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.enRetard}</div>
            <p className="text-xs text-muted-foreground">Relances nécessaires</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un élève (nom, prénom, matricule)..."
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
              <Button variant="ghost" size="icon" onClick={() => fetchData()}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Libellé du frais</TableHead>
                <TableHead>Total ($)</TableHead>
                <TableHead>Payé ($)</TableHead>
                <TableHead>Solde ($)</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Chargement...</TableCell></TableRow>
              ) : filteredFees.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Aucun enregistrement trouvé.</TableCell></TableRow>
              ) : filteredFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    <div className="font-medium">{fee.studentId?.firstName} {fee.studentId?.lastName}</div>
                    <div className="text-xs text-muted-foreground">{fee.studentId?.matricule} • {fee.studentId?.class?.name}</div>
                  </TableCell>
                  <TableCell>{fee.feeDefinitionId?.name}</TableCell>
                  <TableCell className="font-mono">{fee.totalAmount}</TableCell>
                  <TableCell className="font-mono text-green-600">{fee.amountPaid}</TableCell>
                  <TableCell className="font-mono text-destructive font-bold">{fee.balance}</TableCell>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600"
                        title="Envoyer un rappel"
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
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un versement pour {selectedFee?.studentId?.firstName} {selectedFee?.studentId?.lastName}.
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Virement Bancaire</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  <SelectItem value="CREDIT_CARD">Carte de crédit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Référence transaction (Optionnel)</Label>
              <Input id="reference" name="reference" placeholder="Ex: N° Bordereau, Transaction ID" />
            </div>
            <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Percent className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">Paiement partiel autorisé</p>
                <p className="text-[10px] text-muted-foreground">Le solde sera automatiquement mis à jour après validation.</p>
              </div>
            </div>
            <Button type="submit" className="w-full">Valider le paiement</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
