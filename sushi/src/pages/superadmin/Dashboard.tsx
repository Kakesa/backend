import { useState, useEffect } from "react";
import { 
  School, 
  Users, 
  GraduationCap, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Building2,
  Plus,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import type { GlobalStats, SchoolWithStats, SchoolActivity } from "@/types/superadmin.types";
import { 
  apiGetGlobalStats, 
  apiGetAllSchoolsWithStats,
  apiGetSchoolActivities 
} from "@/services/api/superadmin.api";
import { showApiErrorToast, getApiErrorDetails, type ApiErrorDetails } from "@/lib/apiErrorHandler";
import { useLoading } from "@/contexts/LoadingContext";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--muted))"];

// Composant Empty State réutilisable
function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-full">
          <Icon className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Composant pour les cards vides
function EmptyCard({ 
  title, 
  description, 
  icon: Icon,
  message 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  message: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton Loader détaillé pour le Dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Stats Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Status Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-10" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-4 pt-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton 
                    className="w-full rounded-t" 
                    style={{ height: `${Math.random() * 150 + 50}px` }} 
                  />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="relative">
                <Skeleton className="h-48 w-48 rounded-full" />
                <div className="absolute inset-8">
                  <Skeleton className="h-full w-full rounded-full bg-background" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Schools skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-20" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-9 w-20" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-14" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [activities, setActivities] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<ApiErrorDetails | null>(null);
    // ⚡ handleToggleSchoolStatus doit être ici pour accéder à setSchools
  const handleToggleSchoolStatus = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/superadmin/schools/${schoolId}/toggle-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Erreur lors du changement de statut");
      }

      const data = await res.json();

      // Mettre à jour l'état des écoles localement
      setSchools(prev =>
        prev.map(s =>
          s.id === schoolId
            ? { ...s, status: data.data.status } // mettre à jour uniquement le statut
            : s
        )
      );
    } catch (err) {
      console.error("Erreur toggle statut école:", err);
    }
  };
  const loadData = async () => {
    setLoading(true);
    setErrorDetails(null);
    startLoading("Chargement du tableau de bord...");
    try {
      const [statsData, schoolsData, activitiesData] = await Promise.all([
        apiGetGlobalStats(),
        apiGetAllSchoolsWithStats(),
        apiGetSchoolActivities(5),
      ]);
      setStats(statsData);
      setSchools(schoolsData);
      setActivities(activitiesData);
    } catch (err) {
      console.error("Erreur chargement données:", err);
      const details = showApiErrorToast(err, "Dashboard");
      setErrorDetails(details);
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // État de chargement avec skeleton détaillé
  if (loading) {
    return <DashboardSkeleton />;
  }

  // État d'erreur avec message spécifique
  if (errorDetails) {
    const getErrorIcon = () => {
      switch (errorDetails.type) {
        case "network":
        case "timeout":
          return <AlertTriangle className="h-10 w-10 text-warning" />;
        case "unauthorized":
        case "forbidden":
          return <AlertTriangle className="h-10 w-10 text-destructive" />;
        default:
          return <AlertTriangle className="h-10 w-10 text-destructive" />;
      }
    };

    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className={`p-4 rounded-full ${errorDetails.type === "network" ? "bg-warning/10" : "bg-destructive/10"}`}>
          {getErrorIcon()}
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">{errorDetails.message}</p>
          <p className="text-muted-foreground text-sm mt-1">{errorDetails.description}</p>
        </div>
        <Button variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {errorDetails.action || "Réessayer"}
        </Button>
      </div>
    );
  }

  // État complètement vide (pas de stats du tout)
  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Super Admin</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de toutes les écoles et abonnements
          </p>
        </div>
        <Card className="border-dashed">
          <EmptyState
            icon={Building2}
            title="Bienvenue sur votre tableau de bord"
            description="Aucune donnée n'est encore disponible. Commencez par ajouter des écoles à la plateforme pour voir les statistiques apparaître ici."
            action={{
              label: "Ajouter une école",
              onClick: () => navigate("/superadmin/schools")
            }}
          />
        </Card>
      </div>
    );
  }

  // Vérifier si les données sont vides (0 écoles)
  const hasNoSchools = stats.totalSchools === 0;

  // État avec stats mais 0 écoles
  if (hasNoSchools) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Super Admin</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de toutes les écoles et abonnements
          </p>
        </div>

        {/* Stats Cards vides mais élégantes */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Écoles", icon: School, value: "0" },
            { title: "Total Élèves", icon: GraduationCap, value: "0" },
            { title: "Total Enseignants", icon: Users, value: "0" },
            { title: "Revenus Annuels", icon: TrendingUp, value: "0 CDF" },
          ].map((item) => (
            <Card key={item.title} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-muted/30 rounded-bl-full" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{item.value}</div>
                <p className="text-xs text-muted-foreground">En attente de données</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Message principal empty state */}
        <Card className="border-dashed border-2">
          <EmptyState
            icon={Building2}
            title="Aucune école enregistrée"
            description="Votre plateforme est prête ! Ajoutez votre première école pour commencer à suivre les statistiques, les abonnements et les activités."
            action={{
              label: "Ajouter une école",
              onClick: () => navigate("/superadmin/schools")
            }}
          />
        </Card>

        {/* Placeholder pour les graphiques */}
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyCard
            title="Élèves par école"
            description="Répartition des élèves et enseignants"
            icon={GraduationCap}
            message="Les graphiques apparaîtront une fois les écoles ajoutées"
          />
          <EmptyCard
            title="État des abonnements"
            description="Répartition par statut"
            icon={CreditCard}
            message="Les statistiques d'abonnements seront affichées ici"
          />
        </div>
      </div>
    );
  }

  const subscriptionData = [
    { name: "Actifs", value: stats.subscriptions?.active ?? 0, color: "hsl(var(--primary))" },
    { name: "Expirés", value: stats.subscriptions?.expired ?? 0, color: "hsl(var(--destructive))" },
    { name: "En attente", value: stats.subscriptions?.pendingActivation ?? 0, color: "hsl(142 76% 36%)" },
    { name: "Essai", value: stats.subscriptions?.trial ?? 0, color: "hsl(var(--muted-foreground))" },
  ];

  const schoolsChartData = schools.map(s => ({
    name: s.name.split(" ")[0],
    eleves: s.studentCount,
    profs: s.teacherCount,
  }));

  const formatCurrency = (amount: number) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('fr-CD', { 
      style: 'currency', 
      currency: 'CDF',
      maximumFractionDigits: 0 
    }).format(safeAmount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Super Admin</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de toutes les écoles et abonnements
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Vérification si les stats sont chargées */}
      {!stats ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Chargement des statistiques...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards - Style Preskool */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Écoles</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <School className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalSchools || 0}</div>
            <p className="text-xs text-white/80">
              {(stats.activeSchools || 0)} actives, {(stats.inactiveSchools || 0)} inactives
            </p>
            <div className="mt-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white/70">En temps réel</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Élèves</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{(stats.totalStudents || 0).toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Moyenne {stats.totalSchools ? Math.round((stats.totalStudents || 0) / stats.totalSchools) : 0} par école
            </p>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-300" />
              <span className="text-xs text-white/70">+12% ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Enseignants</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{(stats.totalTeachers || 0).toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Moyenne {stats.totalSchools ? Math.round((stats.totalTeachers || 0) / stats.totalSchools) : 0} par école
            </p>
            <div className="mt-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-300" />
              <span className="text-xs text-white/70">{(stats.totalTeachers || 0)} enseignants</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Revenus Annuels</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{formatCurrency(stats.revenue?.annual || 0)}</div>
            <p className="text-xs text-white/80">
              {(stats.totalSchools || 0)} écoles contribuent
            </p>
            <div className="mt-2 flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-orange-300" />
              <span className="text-xs text-white/70">{(stats.subscriptions?.active || 0)} abonnements actifs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abonnements actifs</p>
                <p className="text-2xl font-bold">{stats.subscriptions?.active ?? 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abonnements expirés</p>
                <p className="text-2xl font-bold">{stats.subscriptions?.expired ?? 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(142,76%,36%)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente d'activation</p>
                <p className="text-2xl font-bold">{stats.subscriptions?.pendingActivation ?? 0}</p>
              </div>
              <Clock className="h-8 w-8 text-[hsl(142,76%,36%)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Période d'essai</p>
                <p className="text-2xl font-bold">{stats.subscriptions?.trial ?? 0}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Style Preskool */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bar Chart - Students per school */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Élèves par école
            </CardTitle>
            <CardDescription className="text-blue-700">Répartition des élèves et enseignants</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {schoolsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={schoolsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: '#64748b' }} />
                  <YAxis className="text-xs" tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="eleves" fill="#3b82f6" name="Élèves" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="profs" fill="#10b981" name="Enseignants" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <GraduationCap className="h-12 w-12 text-blue-200 mb-4" />
                <p className="text-sm text-muted-foreground">Aucune donnée à afficher</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Subscription status */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              État des abonnements
            </CardTitle>
            <CardDescription className="text-purple-700">Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {subscriptionData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {subscriptionData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <CreditCard className="h-12 w-12 text-purple-200 mb-4" />
                <p className="text-sm text-muted-foreground">Aucun abonnement enregistré</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Schools needing attention - Style Preskool */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activités récentes
                </CardTitle>
                <CardDescription className="text-green-700">Dernières actions sur la plateforme</CardDescription>
              </div>
              <Button 
                onClick={() => navigate("/superadmin/activities")} 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
              >
                <Clock className="h-4 w-4" />
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={`mt-1 p-2 rounded-full ${
                      activity.type === "success" ? "bg-green-100 text-green-600" :
                      activity.type === "warning" ? "bg-orange-100 text-orange-600" :
                      activity.type === "error" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {activity.type === "success" ? <CheckCircle className="h-4 w-4" /> :
                       activity.type === "warning" ? <AlertTriangle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.schoolName} - {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-10 w-10 text-green-200 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les actions effectuées apparaîtront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schools needing attention */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Écoles à surveiller
                </CardTitle>
                <CardDescription className="text-orange-700">Abonnements expirés ou en attente</CardDescription>
              </div>
              <Button 
                onClick={() => navigate("/superadmin/subscriptions")} 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Gérer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {schools.filter(s => s.subscription.status !== "active").length > 0 ? (
              <div className="space-y-4">
                {schools
                  .filter(s => s.subscription.status !== "active")
                  .map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-3 rounded-lg border bg-orange-50/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{school.name}</p>
                        <p className="text-xs text-muted-foreground">{school.adminEmail}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            school.subscription.status === "expired" ? "destructive" :
                            school.subscription.status === "pending_activation" ? "secondary" :
                            "outline"
                          }
                          className="font-medium"
                        >
                          {school.subscription.status === "expired" ? "Expiré" :
                          school.subscription.status === "pending_activation" ? "En attente" :
                          school.subscription.status === "trial" ? "Essai" : school.subscription.status}
                        </Badge>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleSchoolStatus(school.id)}
                          className="bg-white/80 hover:bg-white"
                        >
                          {school.status === "active" ? "Suspendre" : "Activer"}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-10 w-10 text-green-200 mb-3" />
                <p className="text-sm text-muted-foreground">Tout est en ordre !</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Toutes les écoles ont un abonnement actif
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Témoignages - Style Preskool */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
          <CardTitle className="text-indigo-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Témoignages
          </CardTitle>
          <CardDescription className="text-indigo-700">Ce que disent nos utilisateurs</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Marie Kabongo",
                role: "Directrice - École Primaire Lumière",
                photo: "https://images.unsplash.com/photo-1494790108755-2616b332c3ca?w=150&h=150&fit=crop&crop=face",
                testimonial: "Scholar Buddy a transformé notre gestion scolaire. Plus de papier, tout est numérique et les parents sont ravis !",
                rating: 5
              },
              {
                name: "Jean-Pierre Mwamba",
                role: "Professeur - Lycée Excellence",
                photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                testimonial: "Je peux maintenant suivre facilement la progression de mes élèves. Le système est simple et efficace.",
                rating: 5
              },
              {
                name: "Sophie Ntumba",
                role: "Parent d'élève",
                photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
                testimonial: "Je reçois les notes en temps réel et je peux communiquer directement avec les enseignants. C'est génial !",
                rating: 5
              },
              {
                name: "Thomas Mukendi",
                role: "Administrateur - Groupe Scolaire",
                photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                testimonial: "La plateforme nous a fait gagner un temps précieux dans l'administration de nos 5 écoles.",
                rating: 4
              },
              {
                name: "Grace Mbombo",
                role: "Secrétaire - École Secondaire",
                photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
                testimonial: "La gestion des frais et des paiements n'a jamais été aussi simple. Tout est automatisé !",
                rating: 5
              },
              {
                name: "David Kanza",
                role: "Censeur - Complexe Scolaire",
                photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
                testimonial: "Je peux superviser toutes les activités de notre établissement en temps réel. C'est un outil indispensable.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={testimonial.photo} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-gray-600">{testimonial.role}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic leading-relaxed">"{testimonial.testimonial}"</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Il y a {Math.floor(Math.random() * 30) + 1} jours</span>
                  <Button variant="outline" size="sm" className="text-xs">
                    Voir plus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
