import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { apiGetPaymentPlans, apiCreatePaymentPlan } from "@/services/api/fees.api";
import { toast } from "sonner";

interface Installment {
  dueDate: string;
  amount: number;
  description?: string;
}

interface PaymentPlan {
  id: string;
  studentFeeId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  installments: Installment[];
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

interface PaymentPlanProps {
  studentId?: string;
  studentFeeId?: string;
  totalAmount?: number;
  balance?: number;
}

export default function PaymentPlan({ studentId, studentFeeId, totalAmount, balance }: PaymentPlanProps) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([
    { dueDate: "", amount: 0, description: "" }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await apiGetPaymentPlans(studentId);
        setPlans(data);
      } catch (error) {
        console.error("Error fetching payment plans:", error);
        toast.error("Erreur lors du chargement des plans de paiement");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [studentId]);

  const addInstallment = () => {
    setInstallments([...installments, { dueDate: "", amount: 0, description: "" }]);
  };

  const updateInstallment = (index: number, field: keyof Installment, value: string | number) => {
    const newInstallments = [...installments];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    setInstallments(newInstallments);
  };

  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((_, i) => i !== index));
    }
  };

  const handleCreatePlan = async () => {
    if (!studentFeeId) {
      toast.error("ID du frais requis");
      return;
    }

    const totalInstallmentAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
    if (Math.abs(totalInstallmentAmount - (balance || 0)) > 0.01) {
      toast.error("Le total des échéances doit correspondre au solde dû");
      return;
    }

    try {
      setIsCreating(true);
      await apiCreatePaymentPlan({
        studentFeeId,
        installments
      });

      toast.success("Plan de paiement créé avec succès");
      setIsCreateModalOpen(false);
      setInstallments([{ dueDate: "", amount: 0, description: "" }]);
      
      // Refresh plans
      const data = await apiGetPaymentPlans(studentId);
      setPlans(data);
    } catch (error: any) {
      console.error("Error creating payment plan:", error);
      toast.error(error.message || "Erreur lors de la création du plan de paiement");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-blue-100 text-blue-800">Actif</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Plans de Paiement
            </CardTitle>
            <CardDescription>
              Échelonnez vos paiements sur plusieurs mois
            </CardDescription>
          </div>
          {balance && balance > 0 && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer un Plan de Paiement</DialogTitle>
                  <DialogDescription>
                    Divisez le solde de {balance?.toLocaleString()} $ en plusieurs échéances
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                  {installments.map((installment, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <Label htmlFor={`due-date-${index}`}>Date d'échéance</Label>
                        <Input
                          id={`due-date-${index}`}
                          type="date"
                          value={installment.dueDate}
                          onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`amount-${index}`}>Montant ($)</Label>
                        <Input
                          id={`amount-${index}`}
                          type="number"
                          value={installment.amount || ''}
                          onChange={(e) => updateInstallment(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Input
                          id={`description-${index}`}
                          value={installment.description || ''}
                          onChange={(e) => updateInstallment(index, 'description', e.target.value)}
                          placeholder="Optionnel"
                        />
                      </div>
                      {installments.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeInstallment(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addInstallment}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une échéance
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreatePlan} disabled={isCreating}>
                    {isCreating ? "Création..." : "Créer le plan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun plan de paiement actif</p>
            {balance && balance > 0 && (
              <p className="text-sm mt-2">
                Créez un plan pour échelonner vos paiements
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">Plan #{plan.id.slice(-6)}</h4>
                    <p className="text-sm text-muted-foreground">
                      Créé le {new Date(plan.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {getStatusBadge(plan.status)}
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold">{plan.totalAmount.toLocaleString()} $</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-sm text-green-700">Payé</p>
                    <p className="font-bold text-green-700">{plan.paidAmount.toLocaleString()} $</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="text-sm text-orange-700">Reste</p>
                    <p className="font-bold text-orange-700">{plan.balance.toLocaleString()} $</p>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plan.installments.map((installment, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(installment.dueDate).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="font-bold">
                            {installment.amount.toLocaleString()} $
                          </TableCell>
                          <TableCell>
                            {installment.description || "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(installment.dueDate) < new Date() ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertCircle className="h-3 w-3" />
                                En retard
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Clock className="h-3 w-3" />
                                En attente
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
