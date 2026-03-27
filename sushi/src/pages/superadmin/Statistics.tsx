import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, School, 
  CreditCard, ArrowUpRight, ArrowDownRight, BarChart3, AlertCircle, RefreshCw,
  WifiOff, ShieldAlert
} from "lucide-react";
import { 
  getMonthlyStats, 
  getRevenueByPlan, 
  getGlobalStats,
  getMobileMoneyPayments 
} from "@/data/superadminData";
import { ContentTransition, FadeIn } from "@/components/ui/ContentTransition";
import { showApiErrorToast, getApiErrorDetails, type ApiErrorDetails } from "@/lib/apiErrorHandler";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  muted: "hsl(var(--muted-foreground))",
};

const PLAN_COLORS: Record<string, string> = {
  basic: "#94a3b8",
  standard: "#3b82f6",
  premium: "#8b5cf6",
};

// Skeleton for statistics page
function StatisticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty state
function EmptyStatistics({ onRetry }: { onRetry: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="relative p-4 rounded-full bg-muted">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Aucune donnée</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Les statistiques seront disponibles une fois que des écoles seront enregistrées.
      </p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Actualiser
      </Button>
    </FadeIn>
  );
}

// Error state with specific details
function ErrorState({ errorDetails, onRetry }: { errorDetails: ApiErrorDetails | null; onRetry: () => void }) {
  const getIcon = () => {
    switch (errorDetails?.type) {
      case "network":
      case "timeout":
        return <WifiOff className="h-12 w-12 text-warning" />;
      case "unauthorized":
      case "forbidden":
        return <ShieldAlert className="h-12 w-12 text-destructive" />;
      default:
        return <AlertCircle className="h-12 w-12 text-destructive" />;
    }
  };

  return (
    <FadeIn className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className={`absolute inset-0 rounded-full blur-xl ${errorDetails?.type === "network" ? "bg-warning/20" : "bg-destructive/20"}`} />
        <div className={`relative p-4 rounded-full ${errorDetails?.type === "network" ? "bg-warning/10" : "bg-destructive/10"}`}>
          {getIcon()}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{errorDetails?.message || "Erreur"}</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {errorDetails?.description || "Impossible de charger les statistiques."}
      </p>
      <Button onClick={onRetry} variant="default" className="gap-2">
        {errorDetails?.action || "Réessayer"}
      </Button>
    </FadeIn>
  );
}

export default function SuperAdminStatistics() {
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<ApiErrorDetails | null>(null);
  const [data, setData] = useState<{
    monthlyStats: ReturnType<typeof getMonthlyStats>;
    revenueByPlan: ReturnType<typeof getRevenueByPlan>;
    globalStats: ReturnType<typeof getGlobalStats>;
    payments: ReturnType<typeof getMobileMoneyPayments>;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorDetails(null);
    try {
      // Simulate API call delay for smoother transition demo
      await new Promise(resolve => setTimeout(resolve, 500));
      setData({
        monthlyStats: getMonthlyStats(),
        revenueByPlan: getRevenueByPlan(),
        globalStats: getGlobalStats(),
        payments: getMobileMoneyPayments(),
      });
    } catch (err) {
      const details = showApiErrorToast(err, "Statistiques");
      setErrorDetails(details);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (errorDetails) {
    return <ErrorState errorDetails={errorDetails} onRetry={loadData} />;
  }

  const monthlyStats = data?.monthlyStats || [];
  const revenueByPlan = data?.revenueByPlan || [];
  const globalStats = data?.globalStats;
  const payments = data?.payments || [];

  const currentMonth = monthlyStats[monthlyStats.length - 1];
  const previousMonth = monthlyStats[monthlyStats.length - 2];
  
  const revenueTrend = previousMonth && currentMonth
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
    : "0";
  
  const subscriptionTrend = previousMonth && currentMonth
    ? currentMonth.activeSubscriptions - previousMonth.activeSubscriptions
    : 0;

  const subscriptionPieData = globalStats ? [
    { name: "Actifs", value: globalStats.subscriptions.active, color: COLORS.success },
    { name: "Expirés", value: globalStats.subscriptions.expired, color: COLORS.danger },
    { name: "En attente", value: globalStats.subscriptions.pendingActivation, color: COLORS.warning },
    { name: "Essai", value: globalStats.subscriptions.trial, color: COLORS.info },
  ] : [];

  const completedPayments = payments.filter(p => p.status === "completed");
  const totalPayments = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CD', { 
      style: 'decimal',
      maximumFractionDigits: 0 
    }).format(value) + " CDF";
  };

  return (
    <ContentTransition isLoading={loading} skeleton={<StatisticsSkeleton />}>
      <div className="space-y-6">
        <FadeIn>
          <div>
            <h1 className="text-3xl font-bold">Statistiques & Revenus</h1>
            <p className="text-muted-foreground">Analyse détaillée des performances de la plateforme</p>
          </div>
        </FadeIn>

        {!globalStats ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyStatistics onRetry={loadData} />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPIs principaux */}
            <FadeIn delay={50}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="animate-fade-in" style={{ animationDelay: "0ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentMonth ? formatCurrency(currentMonth.revenue) : "—"}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {Number(revenueTrend) >= 0 ? (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">+{revenueTrend}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                          <span className="text-red-500">{revenueTrend}%</span>
                        </>
                      )}
                      <span className="ml-1">vs mois dernier</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{globalStats.subscriptions.active}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {subscriptionTrend >= 0 ? (
                        <span className="text-green-500">+{subscriptionTrend} ce mois</span>
                      ) : (
                        <span className="text-red-500">{subscriptionTrend} ce mois</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total élèves</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{globalStats.totalStudents}</div>
                    <div className="text-xs text-muted-foreground">
                      +{currentMonth?.newStudents || 0} nouveaux ce mois
                    </div>
                  </CardContent>
                </Card>

                <Card className="animate-fade-in" style={{ animationDelay: "150ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenu annuel</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(globalStats.revenue.annual)}</div>
                    <div className="text-xs text-muted-foreground">
                      Projection sur abonnements actifs
                    </div>
                  </CardContent>
                </Card>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="revenue">Revenus</TabsTrigger>
                  <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
                  <TabsTrigger value="growth">Croissance</TabsTrigger>
                  <TabsTrigger value="payments">Paiements</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Évolution des revenus</CardTitle>
                        <CardDescription>Revenus mensuels sur les 12 derniers mois</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis 
                              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              labelFormatter={(label) => `Mois: ${label}`}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke={COLORS.primary}
                              fill={COLORS.primary}
                              fillOpacity={0.3}
                              name="Revenus"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Revenus par plan</CardTitle>
                        <CardDescription>Répartition selon les formules d'abonnement</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={revenueByPlan.filter(p => p.amount > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="amount"
                              nameKey="plan"
                              label={({ plan, percent }) => 
                                `${plan.charAt(0).toUpperCase() + plan.slice(1)} (${(percent * 100).toFixed(0)}%)`
                              }
                            >
                              {revenueByPlan.map((entry) => (
                                <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || COLORS.muted} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-4">
                          {revenueByPlan.map((plan) => (
                            <div key={plan.plan} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: PLAN_COLORS[plan.plan] || COLORS.muted }}
                              />
                              <span className="text-sm capitalize">{plan.plan}</span>
                              <Badge variant="secondary">{plan.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="subscriptions" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Évolution des abonnements</CardTitle>
                        <CardDescription>Abonnements actifs vs expirés par mois</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="activeSubscriptions" 
                              stroke={COLORS.success}
                              strokeWidth={2}
                              name="Actifs"
                              dot={{ fill: COLORS.success }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="expiredSubscriptions" 
                              stroke={COLORS.danger}
                              strokeWidth={2}
                              name="Expirés"
                              dot={{ fill: COLORS.danger }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Répartition actuelle</CardTitle>
                        <CardDescription>Statut des abonnements</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={subscriptionPieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {subscriptionPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                          {subscriptionPieData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="growth" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Nouvelles écoles</CardTitle>
                        <CardDescription>Inscriptions mensuelles</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar 
                              dataKey="newSchools" 
                              fill={COLORS.info}
                              name="Nouvelles écoles"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Nouveaux élèves</CardTitle>
                        <CardDescription>Inscriptions d'élèves par mois</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Area 
                              type="monotone"
                              dataKey="newStudents" 
                              stroke={COLORS.success}
                              fill={COLORS.success}
                              fillOpacity={0.3}
                              name="Nouveaux élèves"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historique des paiements Mobile Money</CardTitle>
                      <CardDescription>
                        Total encaissé: {formatCurrency(totalPayments)} | {completedPayments.length} transactions réussies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {payments.length === 0 ? (
                        <FadeIn className="flex flex-col items-center justify-center py-12">
                          <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Aucun paiement enregistré</p>
                        </FadeIn>
                      ) : (
                        <div className="space-y-4">
                          {payments.map((payment, index) => (
                            <div 
                              key={payment.id} 
                              className="flex items-center justify-between p-4 border rounded-lg animate-fade-in"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${
                                  payment.status === "completed" ? "bg-green-100" :
                                  payment.status === "failed" ? "bg-red-100" :
                                  "bg-yellow-100"
                                }`}>
                                  <CreditCard className={`h-4 w-4 ${
                                    payment.status === "completed" ? "text-green-600" :
                                    payment.status === "failed" ? "text-red-600" :
                                    "text-yellow-600"
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {payment.provider.replace("_", " ").toUpperCase()} • {payment.phoneNumber}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={
                                  payment.status === "completed" ? "default" :
                                  payment.status === "failed" ? "destructive" :
                                  "secondary"
                                }>
                                  {payment.status === "completed" ? "Réussi" :
                                   payment.status === "failed" ? "Échoué" :
                                   "En cours"}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </FadeIn>
          </>
        )}
      </div>
    </ContentTransition>
  );
}
