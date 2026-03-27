// ==========================================
// PAGE - DÃ©tails d'une Ã©cole
// ==========================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  School,
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  MapPin,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Power,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts";
import type { SchoolWithStats } from "@/types/superadmin.types";
import { apiGetSchoolWithStatsById, apiToggleSchoolStatus } from "@/services/api/superadmin.api";
import { showApiErrorToast, showApiSuccessToast, type ApiErrorDetails } from "@/lib/apiErrorHandler";
import { ContentTransition, FadeIn } from "@/components/ui/ContentTransition";
import { useLoading } from "@/contexts/LoadingContext";

// Configuration des graphiques
const studentChartConfig: ChartConfig = {
  students: {
    label: "Ã‰lÃ¨ves",
    color: "hsl(var(--primary))",
  },
  teachers: {
    label: "Enseignants",
    color: "hsl(var(--chart-2))",
  },
};

const paymentChartConfig: ChartConfig = {
  amount: {
    label: "Paiements",
    color: "hsl(var(--chart-1))",
  },
};
 
 // Skeleton pour la page de dÃ©tails
 function DetailsSkeleton() {
   return (
     <div className="space-y-6 animate-pulse">
       <div className="flex items-center gap-4">
         <Skeleton className="h-10 w-10 rounded-lg" />
         <div className="space-y-2">
           <Skeleton className="h-8 w-64" />
           <Skeleton className="h-4 w-48" />
         </div>
       </div>
 
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {[...Array(4)].map((_, i) => (
           <Card key={i}>
             <CardContent className="pt-6">
               <div className="flex items-center gap-4">
                 <Skeleton className="h-12 w-12 rounded-lg" />
                 <div className="space-y-2">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-6 w-12" />
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
 
       <div className="grid gap-6 lg:grid-cols-2">
         <Card>
           <CardHeader>
             <Skeleton className="h-6 w-40" />
           </CardHeader>
           <CardContent className="space-y-4">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="flex justify-between">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-4 w-32" />
               </div>
             ))}
           </CardContent>
         </Card>
         <Card>
           <CardHeader>
             <Skeleton className="h-6 w-40" />
           </CardHeader>
           <CardContent className="space-y-4">
             {[...Array(4)].map((_, i) => (
               <div key={i} className="flex justify-between">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-4 w-32" />
               </div>
             ))}
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }
 
 function ErrorState({ error, onRetry }: { error: ApiErrorDetails; onRetry: () => void }) {
   return (
     <FadeIn className="flex flex-col items-center justify-center py-16 px-4">
       <div className="relative mb-6">
         <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
         <div className="relative p-4 rounded-full bg-destructive/10">
           <AlertCircle className="h-12 w-12 text-destructive" />
         </div>
       </div>
       <h3 className="text-xl font-semibold text-foreground mb-2">{error.message}</h3>
       <p className="text-muted-foreground text-center max-w-sm mb-6">{error.description}</p>
       <Button onClick={onRetry} variant="default" className="gap-2">
         <RefreshCw className="h-4 w-4" />
         {error.action || "RÃ©essayer"}
       </Button>
     </FadeIn>
   );
 }
 
 export default function SchoolDetails() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { startLoading, stopLoading } = useLoading();
   
  const [school, setSchool] = useState<SchoolWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<ApiErrorDetails | null>(null);
  const [toggling, setToggling] = useState(false);

  // DonnÃ©es simulÃ©es pour les graphiques (Ãremplacer par API rÃ©elle)
  const studentEvolutionData = useMemo(() => {
    if (!school) return [];
    const baseStudents = Math.max(school.studentCount - 50, 10);
    const baseTeachers = Math.max(school.teacherCount - 5, 2);
    return [
      { month: "Sept", students: baseStudents, teachers: baseTeachers },
      { month: "Oct", students: baseStudents + 12, teachers: baseTeachers + 1 },
      { month: "Nov", students: baseStudents + 18, teachers: baseTeachers + 1 },
      { month: "Dec", students: baseStudents + 25, teachers: baseTeachers + 2 },
      { month: "Jan", students: baseStudents + 35, teachers: baseTeachers + 3 },
      { month: "Fev", students: baseStudents + 50, teachers: baseTeachers + 5 },
    ];
  }, [school]);

  const paymentHistoryData = useMemo(() => {
    if (!school) return [];
    const baseAmount = school.subscription.amount / 12;
    return [
      { month: "Sept", amount: baseAmount, status: "paid" },
      { month: "Oct", amount: baseAmount, status: "paid" },
      { month: "Nov", amount: baseAmount, status: "paid" },
      { month: "Dec", amount: baseAmount * 1.2, status: "paid" },
      { month: "Jan", amount: baseAmount, status: "paid" },
      { month: "Fev", amount: baseAmount, status: "pending" },
    ];
  }, [school]);
 
  const loadSchool = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setErrorDetails(null);
    startLoading("Chargement des dÃ©tails...");
    
    try {
      const data = await apiGetSchoolWithStatsById(id);
      setSchool(data || null);
    } catch (err) {
      console.error("Erreur chargement Ã©cole:", err);
      const details = showApiErrorToast(err, "Chargement Ã©cole");
      setErrorDetails(details);
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [id, startLoading, stopLoading]);
 
  useEffect(() => {
    loadSchool();
  }, [loadSchool]);
 
   const handleToggleStatus = async () => {
     if (!school) return;
     
     setToggling(true);
     startLoading("Modification du statut...");
     
     try {
       await apiToggleSchoolStatus(school.id);
       await loadSchool();
       showApiSuccessToast(
         `Ã‰cole ${school.status === "active" ? "dÃ©sactivÃ©e" : "activÃ©e"}`,
         `${school.name} a Ã©tÃ© ${school.status === "active" ? "dÃ©sactivÃ©e" : "activÃ©e"} avec succÃ¨s`
       );
     } catch (err) {
       showApiErrorToast(err, "Modification statut");
     } finally {
       setToggling(false);
       stopLoading();
     }
   };
 
    const getTrialDaysRemaining = (endDate: string) => {
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    };

    const getSubscriptionBadge = (school: SchoolWithStats) => {
      const status = school.subscription.status;
      const endDate = school.subscription.endDate;

      switch (status) {
        case "active":
          return <Badge className="bg-primary">Actif</Badge>;
        case "expired":
          return <Badge variant="destructive">ExpirÃ©</Badge>;
        case "pending_activation":
          return <Badge variant="secondary">En attente</Badge>;
        case "trial": {
          const daysLeft = getTrialDaysRemaining(endDate);
          return (
            <Badge variant="outline" className={daysLeft <= 5 ? "border-destructive text-destructive" : ""}>
              Essai ({daysLeft}j restants)
            </Badge>
          );
        }
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };
 
   const formatDate = (date: string) => {
     return new Date(date).toLocaleDateString("fr-FR", {
       day: "numeric",
       month: "long",
       year: "numeric",
     });
   };
 
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat("fr-CD", {
       style: "currency",
       currency: "CDF",
       maximumFractionDigits: 0,
     }).format(amount);
   };
 
   if (errorDetails) {
     return (
       <div className="space-y-6">
         <Button variant="ghost" onClick={() => navigate("/superadmin/schools")} className="gap-2">
           <ArrowLeft className="h-4 w-4" />
           Retour aux Ã©coles
         </Button>
         <ErrorState error={errorDetails} onRetry={loadSchool} />
       </div>
     );
   }
 
   return (
     <ContentTransition isLoading={loading} skeleton={<DetailsSkeleton />}>
       <div className="space-y-6">
         {/* Header */}
         <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/schools")}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-primary/10">
                 <School className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <h1 className="text-2xl sm:text-3xl font-bold">{school?.name}</h1>
                 <p className="text-muted-foreground">{school?.code}</p>
               </div>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Badge variant={school?.status === "active" ? "default" : "secondary"} className="text-sm">
               {school?.status === "active" ? "Active" : "Inactive"}
             </Badge>
             <Button
               variant={school?.status === "active" ? "destructive" : "default"}
               size="sm"
               onClick={handleToggleStatus}
               disabled={toggling}
               className="gap-2"
             >
               <Power className="h-4 w-4" />
               {school?.status === "active" ? "DÃ©sactiver" : "Activer"}
             </Button>
           </div>
         </FadeIn>
 
         {/* Stats Cards */}
         <FadeIn delay={50}>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                   <div className="p-3 rounded-lg bg-primary/10">
                     <GraduationCap className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Ã‰lÃ¨ves</p>
                     <p className="text-2xl font-bold">{school?.studentCount || 0}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                   <div className="p-3 rounded-lg bg-secondary">
                     <Users className="h-6 w-6 text-secondary-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Enseignants</p>
                     <p className="text-2xl font-bold">{school?.teacherCount || 0}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                   <div className="p-3 rounded-lg bg-accent">
                     <BookOpen className="h-6 w-6 text-accent-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Classes</p>
                     <p className="text-2xl font-bold">{school?.classCount || 0}</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                   <div className="p-3 rounded-lg bg-muted">
                     <CreditCard className="h-6 w-6 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Abonnement</p>
                     {school && getSubscriptionBadge(school)}
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </FadeIn>
 
         {/* Details Grid */}
         <FadeIn delay={100}>
           <div className="grid gap-6 lg:grid-cols-2">
             {/* Informations gÃ©nÃ©rales */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <School className="h-5 w-5" />
                   Informations gÃ©nÃ©rales
                 </CardTitle>
                 <CardDescription>CoordonnÃ©es et dÃ©tails de l'Ã©tablissement</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground">Type</span>
                   <span className="font-medium">{school?.types}</span>
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground flex items-center gap-2">
                     <MapPin className="h-4 w-4" /> Adresse
                   </span>
                   <span className="font-medium text-right">{school?.address}</span>
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground">Ville</span>
                   <span className="font-medium">{school?.city}, {school?.country}</span>
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground flex items-center gap-2">
                     <Mail className="h-4 w-4" /> Email
                   </span>
                   <span className="font-medium">{school?.email}</span>
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground flex items-center gap-2">
                     <Phone className="h-4 w-4" /> TÃ©lÃ©phone
                   </span>
                   <span className="font-medium">{school?.phone}</span>
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground flex items-center gap-2">
                     <Calendar className="h-4 w-4" /> CrÃ©Ã© le
                   </span>
                   <span className="font-medium">{school?.createdAt && formatDate(school.createdAt)}</span>
                 </div>
               </CardContent>
             </Card>
 
             {/* Administrateur & Abonnement */}
             <div className="space-y-6">
               {/* Admin */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Users className="h-5 w-5" />
                     Administrateur
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Nom</span>
                     <span className="font-medium">{school?.adminName}</span>
                   </div>
                   <Separator />
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Email</span>
                     <span className="font-medium">{school?.adminEmail}</span>
                   </div>
                 </CardContent>
               </Card>
 
               {/* Abonnement */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <CreditCard className="h-5 w-5" />
                     Abonnement
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Plan</span>
                     <Badge variant="outline" className="capitalize">{school?.subscription.plan}</Badge>
                   </div>
                   <Separator />
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Statut</span>
                     {school && getSubscriptionBadge(school)}
                   </div>
                   <Separator />
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">DÃ©but</span>
                     <span className="font-medium">{school?.subscription.startDate && formatDate(school.subscription.startDate)}</span>
                   </div>
                   <Separator />
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Expiration</span>
                     <span className="font-medium">{school?.subscription.endDate && formatDate(school.subscription.endDate)}</span>
                   </div>
                   <Separator />
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Montant</span>
                     <span className="font-bold text-lg">{formatCurrency(school?.subscription.amount || 0)}</span>
                   </div>
                </CardContent>
                </Card>
              </div>
            </div>
          </FadeIn>

          {/* Graphiques */}
          <FadeIn delay={150}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Ã‰volution des effectifs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Ã‰volution des effectifs
                  </CardTitle>
                  <CardDescription>
                    Croissance des Ã©lÃ¨ves et enseignants sur l'annÃ©e scolaire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={studentChartConfig} className="h-[250px] w-full">
                    <AreaChart
                      data={studentEvolutionData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="fillStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillTeachers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs fill-muted-foreground"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs fill-muted-foreground"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="students"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#fillStudents)"
                        name="Ã‰lÃ¨ves"
                      />
                      <Area
                        type="monotone"
                        dataKey="teachers"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        fill="url(#fillTeachers)"
                        name="Enseignants"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Historique des paiements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-chart-1" />
                    Historique des paiements
                  </CardTitle>
                  <CardDescription>
                    Montants des paiements mensuels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={paymentChartConfig} className="h-[250px] w-full">
                    <BarChart
                      data={paymentHistoryData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs fill-muted-foreground"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        className="text-xs fill-muted-foreground"
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => (
                              <div className="flex items-center justify-between gap-4">
                                <span>{formatCurrency(Number(value))}</span>
                                <Badge
                                  variant={item.payload.status === "paid" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {item.payload.status === "paid" ? "PayÃ©" : "En attente"}
                                </Badge>
                              </div>
                            )}
                          />
                        }
                      />
                      <Bar
                        dataKey="amount"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                        name="Montant"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </div>
      </ContentTransition>
    );
  }
