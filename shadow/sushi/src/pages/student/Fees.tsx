/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
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
  Wallet, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowRight,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetStudentFees, StudentFee } from "@/services/api/fees.api";

export default function StudentFees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await apiGetStudentFees(user.id);
      setFees(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos frais scolaires.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID": return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> En règle</Badge>;
      case "PARTIAL": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200"><Clock className="w-3 h-3 mr-1" /> Partiel</Badge>;
      case "UNPAID": return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Non payé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalBalance = fees.reduce((acc, f) => acc + f.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Frais Scolaires</h1>
          <p className="text-muted-foreground">Consultez vos soldes et effectuez vos paiements.</p>
        </div>
        <Button variant="outline" onClick={() => fetchData()}>
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solde Total à Payer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalBalance.toLocaleString()} $</div>
            <p className="text-xs text-muted-foreground mt-1">Cumul de tous les frais en cours</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Statut de Compte</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {totalBalance === 0 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="font-bold">À JOUR</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-500">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-bold">EN ATTENTE</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex items-center justify-center p-6 text-center sm:col-span-2 lg:col-span-1">
            <div>
                <p className="text-xs text-muted-foreground mb-2">Besoin d'aide ?</p>
                <Button variant="link" size="sm" className="h-auto p-0">Contacter la comptabilité</Button>
            </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails des frais</CardTitle>
          <CardDescription>Liste exhaustive des frais attribués pour l'année en cours.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border-t sm:border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Libellé</TableHead>
                  <TableHead>Total ($)</TableHead>
                  <TableHead>Payé ($)</TableHead>
                  <TableHead>Solde ($)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">Chargement...</TableCell></TableRow>
                ) : fees.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">Aucun frais enregistré.</TableCell></TableRow>
                ) : fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      {fee.feeDefinitionId?.name}
                      <div className="text-xs text-muted-foreground font-normal">{fee.feeDefinitionId?.academicYear}</div>
                    </TableCell>
                    <TableCell>{fee.totalAmount}</TableCell>
                    <TableCell className="text-green-600">{fee.amountPaid}</TableCell>
                    <TableCell className="font-bold">{fee.balance}</TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={fee.status === "PAID"}
                        onClick={() => toast({ title: "Paiement", description: "Veuillez vous présenter à la caisse." })}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Options de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-3">
                <p className="font-bold text-sm">Virement Bancaire</p>
                <p className="text-xs text-muted-foreground mt-1">Banque : RAW BANK</p>
                <p className="text-xs text-muted-foreground">RIB : 0123-4567-8901-2345</p>
                <p className="text-[10px] italic mt-2 text-primary">Veuillez indiquer le matricule de l'élève en motif.</p>
            </div>
            <div className="border rounded-lg p-3">
                <p className="font-bold text-sm">Mobile Money (M-Pesa / Airtel Money)</p>
                <p className="text-xs text-muted-foreground mt-1">Numéro : +243 812 345 678</p>
                <p className="text-xs text-muted-foreground">Nom : ECOLE SMART PROJECT</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" disabled>
                Reçu dernier paiement (N/A)
                <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" disabled>
                Attestation de scolarité
                <Download className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
