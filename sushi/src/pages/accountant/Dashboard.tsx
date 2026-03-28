/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetAllFeeStatuses } from "@/services/api/fees.api";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Banknote,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Loader2,
  Mail,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function AccountantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalPaid: 0,
    paidCount: 0,
    unpaidCount: 0,
    collectionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const feesData = await apiGetAllFeeStatuses();
        
        const totalExp = feesData.reduce((acc, f) => acc + f.totalAmount, 0);
        const totalPd = feesData.reduce((acc, f) => acc + f.amountPaid, 0);
        const paid = feesData.filter(f => f.status === "PAID").length;
        const unpaid = feesData.filter(f => f.status === "UNPAID" || f.status === "PARTIAL").length;
        const rate = totalExp > 0 ? (totalPd / totalExp) * 100 : 0;

        setStats({
          totalExpected: totalExp,
          totalPaid: totalPd,
          paidCount: paid,
          unpaidCount: unpaid,
          collectionRate: rate
        });
      } catch (err) {
        console.error("Failed to load accountant stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const financialStats = [
    { label: "Revenu Attendu", value: `${stats.totalExpected.toLocaleString()} $`, icon: Banknote, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Encaissé", value: `${stats.totalPaid.toLocaleString()} $`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Taux de Recouvrement", value: `${Math.round(stats.collectionRate)}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Élèves Non à Jour", value: stats.unpaidCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Espace Comptabilité</h1>
        <p className="text-muted-foreground">Bonjour {user?.firstName}, voici l'état financier de l'établissement.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {financialStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Gérez les paiements et rappels</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link to="/accountant/fees">
              <Button className="w-full justify-between h-auto py-4" variant="outline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Suivi des Frais</p>
                    <p className="text-xs text-muted-foreground italic">Voir tous les états de paiement</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/accountant/messaging">
              <Button className="w-full justify-between h-auto py-4" variant="outline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Envoyer Rappels</p>
                    <p className="text-xs text-muted-foreground italic">Contacter les parents en retard</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Collection Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Paiements</CardTitle>
            <CardDescription>Aperçu par statut d'élève</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> En Règle</span>
                <span className="font-medium">{stats.paidCount} élèves</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${(stats.paidCount / ((stats.paidCount + stats.unpaidCount) || 1)) * 100}%` }} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Partiel / En retard</span>
                <span className="font-medium">{stats.unpaidCount} élèves</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(stats.unpaidCount / ((stats.paidCount + stats.unpaidCount) || 1)) * 100}%` }} 
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux global</p>
                  <p className="text-2xl font-bold">{Math.round(stats.collectionRate)}%</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-primary/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
