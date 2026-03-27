import React, { useState, useEffect } from "react";
import { Activity, Filter, Clock, AlertCircle, WifiOff, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SchoolActivity } from "@/types/superadmin.types";
import { apiGetSchoolActivities } from "@/services/api/superadmin.api";
import { ContentTransition, FadeIn } from "@/components/ui/ContentTransition";
import { showApiErrorToast, getApiErrorDetails, type ApiErrorDetails } from "@/lib/apiErrorHandler";

// Skeleton for activities page
function ActivitiesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Activity items skeleton */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-border/50">
              <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Empty state component
function EmptyActivities({ onRetry }: { onRetry: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="relative p-4 rounded-full bg-muted">
          <Clock className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Aucune activité</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Le journal d'activités est vide. Les actions effectuées sur la plateforme apparaîtront ici.
      </p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <Activity className="h-4 w-4" />
        Actualiser
      </Button>
    </FadeIn>
  );
}

// Empty filtered state
function EmptyFilteredActivities({ onReset }: { onReset: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-12 px-4">
      <Filter className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Aucun résultat</h3>
      <p className="text-muted-foreground text-center mb-4">
        Aucune activité ne correspond au filtre sélectionné.
      </p>
      <Button onClick={onReset} variant="ghost" size="sm">
        Réinitialiser le filtre
      </Button>
    </FadeIn>
  );
}

// Error state with specific error details
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
        {errorDetails?.description || "Une erreur s'est produite."}
      </p>
      <Button onClick={onRetry} variant="default" className="gap-2">
        {errorDetails?.action || "Réessayer"}
      </Button>
    </FadeIn>
  );
}

export default function SuperAdminActivities() {
  const [activities, setActivities] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<ApiErrorDetails | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loadActivities = async () => {
    setLoading(true);
    setErrorDetails(null);
    try {
      const data = await apiGetSchoolActivities();
      setActivities(data);
    } catch (err) {
      const details = showApiErrorToast(err, "Activités");
      setErrorDetails(details);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filtered = typeFilter === "all" ? activities : activities.filter(a => a.type === typeFilter);

  if (errorDetails) {
    return <ErrorState errorDetails={errorDetails} onRetry={loadActivities} />;
  }

  return (
    <ContentTransition
      isLoading={loading}
      skeleton={<ActivitiesSkeleton />}
    >
      <div className="space-y-6">
        <FadeIn className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Journal d'activités</h1>
            <p className="text-muted-foreground">Historique des actions sur la plateforme</p>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filtrer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
            </SelectContent>
          </Select>
        </FadeIn>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyActivities onRetry={loadActivities} />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyFilteredActivities onReset={() => setTypeFilter("all")} />
            </CardContent>
          </Card>
        ) : (
          <FadeIn delay={100}>
            <Card>
              <CardContent className="pt-6 space-y-4">
                {filtered.map((a, index) => (
                  <div 
                    key={a.id} 
                    className="flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 hover:border-primary/30 hover:shadow-sm animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Activity className={`h-5 w-5 mt-0.5 ${a.type === "success" ? "text-primary" : a.type === "warning" ? "text-destructive" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.action}</span>
                        <Badge variant="outline">{a.schoolName}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(a.timestamp).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </div>
    </ContentTransition>
  );
}
