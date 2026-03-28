import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Calendar, DollarSign, CreditCard, Smartphone, Building } from "lucide-react";
import { apiGetPaymentHistory, apiDownloadPaymentReceipt } from "@/services/api/fees.api";
import type { PaymentRecords } from "@/services/api/fees.api";
import { toast } from "sonner";

interface PaymentHistoryProps {
  studentId?: string;
  studentFeeId?: string;
}

export default function PaymentHistory({ studentId, studentFeeId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecords[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await apiGetPaymentHistory(studentId, studentFeeId);
        setPayments(data);
      } catch (error) {
        console.error("Error fetching payment history:", error);
        toast.error("Erreur lors du chargement de l'historique des paiements");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [studentId, studentFeeId]);

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const blob = await apiDownloadPaymentReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-paiement-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Reçu téléchargé avec succès");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Erreur lors du téléchargement du reçu");
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "MOBILE_MONEY":
        return <Smartphone className="h-4 w-4" />;
      case "CASH":
        return <DollarSign className="h-4 w-4" />;
      case "BANK_TRANSFER":
        return <Building className="h-4 w-4" />;
      case "CREDIT_CARD":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "MOBILE_MONEY":
        return "Mobile Money";
      case "CASH":
        return "Espèces";
      case "BANK_TRANSFER":
        return "Virement Bancaire";
      case "CREDIT_CARD":
        return "Carte de Crédit";
      default:
        return method;
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
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Historique des Paiements
        </CardTitle>
        <CardDescription>
          Historique complet de vos paiements scolaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {payment.amount.toLocaleString()} $
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        <span>{getMethodLabel(payment.method)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.reference || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment.id)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Reçu
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
