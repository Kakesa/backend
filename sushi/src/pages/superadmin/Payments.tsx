import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Search, Filter, Eye, RefreshCw, CheckCircle, XCircle, Clock, Smartphone } from "lucide-react";
import { mobileMoneyPayments } from "@/data/superadminData";
import { MobileMoneyPayment, MobileMoneyProvider } from "@/types/superadmin.types";
import { MobileMoneyPaymentForm } from "@/components/payments/MobileMoneyPaymentForm";

const providerNames: Record<MobileMoneyProvider, string> = {
  mpesa: "M-Pesa",
  orange_money: "Orange Money",
  airtel_money: "Airtel Money",
  africell: "Africell",
};

const providerColors: Record<MobileMoneyProvider, string> = {
  mpesa: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  orange_money: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  airtel_money: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  africell: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusConfig = {
  pending: { label: "En attente", icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  processing: { label: "En cours", icon: RefreshCw, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Complété", icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  failed: { label: "Échoué", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function SuperAdminPayments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<MobileMoneyPayment | null>(null);

  const filteredPayments = mobileMoneyPayments.filter((payment) => {
    const matchesSearch = 
      payment.phoneNumber.includes(searchTerm) || 
      payment.transactionId?.includes(searchTerm) ||
      payment.id.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesProvider = providerFilter === "all" || payment.provider === providerFilter;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " " + currency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalCompleted = mobileMoneyPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = mobileMoneyPayments
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Paiements Mobile Money</h1>
          <p className="text-muted-foreground">Gérer et suivre tous les paiements</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Smartphone className="mr-2 h-4 w-4" />
              Nouveau paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Initier un paiement</DialogTitle>
            </DialogHeader>
            <MobileMoneyPaymentForm
              subscriptionPlan="standard"
              amount={150000}
              currency="XOF"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mobileMoneyPayments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complétés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(totalCompleted, "XOF")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatAmount(totalPending, "XOF")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Échoués</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mobileMoneyPayments.filter((p) => p.status === "failed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par téléphone, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Opérateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les opérateurs</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="airtel_money">Airtel Money</SelectItem>
                <SelectItem value="africell">Africell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            {filteredPayments.length} transaction(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaction</TableHead>
                <TableHead>Opérateur</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const status = statusConfig[payment.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.transactionId || payment.id.slice(0, 12)}
                    </TableCell>
                    <TableCell>
                      <Badge className={providerColors[payment.provider]}>
                        {providerNames[payment.provider]}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.phoneNumber}</TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog détails */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono">{selectedPayment.transactionId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opérateur</p>
                  <Badge className={providerColors[selectedPayment.provider]}>
                    {providerNames[selectedPayment.provider]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p>{selectedPayment.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="font-bold">
                    {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={statusConfig[selectedPayment.status].color}>
                    {statusConfig[selectedPayment.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p>{formatDate(selectedPayment.createdAt)}</p>
                </div>
                {selectedPayment.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Complété le</p>
                    <p>{formatDate(selectedPayment.completedAt)}</p>
                  </div>
                )}
              </div>
              {selectedPayment.errorMessage && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                  <p className="text-sm font-medium">Erreur:</p>
                  <p className="text-sm">{selectedPayment.errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
