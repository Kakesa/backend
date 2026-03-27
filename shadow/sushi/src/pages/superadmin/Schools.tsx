import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  School, 
  Search, 
  MoreHorizontal, 
  Eye,
  Mail,
  Power,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  AlertCircle,
  RefreshCw,
  WifiOff,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SchoolWithStats } from "@/types/superadmin.types";
import { 
  apiGetAllSchoolsWithStats,
  apiToggleSchoolStatus,
  apiSendSubscriptionReminder
} from "@/services/api/superadmin.api";
import { ContentTransition, FadeIn } from "@/components/ui/ContentTransition";
import { showApiErrorToast, showApiSuccessToast, getApiErrorDetails, type ApiErrorDetails } from "@/lib/apiErrorHandler";
import { useLoading } from "@/contexts/LoadingContext";

// Skeleton for schools page
function SchoolsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-4 pb-2 border-b border-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-4 py-3">
                <div className="flex items-center gap-3 col-span-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-12 mx-auto" />
                <Skeleton className="h-4 w-12 mx-auto" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptySchools({ onRetry }: { onRetry: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="relative p-4 rounded-full bg-muted">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Aucune école</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Aucune école n'est encore enregistrée sur la plateforme.
      </p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Actualiser
      </Button>
    </FadeIn>
  );
}

function EmptySearchResults({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={8}>
        <FadeIn className="flex flex-col items-center justify-center py-12">
          <Search className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun résultat</h3>
          <p className="text-muted-foreground text-center mb-4">
            Aucune école ne correspond à "{query}"
          </p>
          <Button onClick={onReset} variant="ghost" size="sm">
            Effacer la recherche
          </Button>
        </FadeIn>
      </TableCell>
    </TableRow>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
        <div className="relative p-4 rounded-full bg-destructive/10">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Erreur de chargement</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Impossible de charger la liste des écoles.
      </p>
      <Button onClick={onRetry} variant="default" className="gap-2">
        Réessayer
      </Button>
    </FadeIn>
  );
}

export default function SuperAdminSchools() {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<ApiErrorDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithStats | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const loadSchools = useCallback(async () => {
    setLoading(true);
    setErrorDetails(null);
    startLoading("Chargement des écoles...");
    try {
      const data = await apiGetAllSchoolsWithStats();
      setSchools(data);
    } catch (err) {
      console.error("Erreur chargement écoles:", err);
      const details = showApiErrorToast(err, "Chargement écoles");
      setErrorDetails(details);
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const handleToggleStatus = async (school: SchoolWithStats) => {
    try {
      await apiToggleSchoolStatus(school.id);
      await loadSchools();
      showApiSuccessToast(
        `École ${school.status === "active" ? "désactivée" : "activée"}`,
        `${school.name} a été ${school.status === "active" ? "désactivée" : "activée"} avec succès`
      );
    } catch (err) {
      showApiErrorToast(err, "Modification statut");
    }
  };

  const handleSendEmail = async (school: SchoolWithStats, type: "payment_due" | "subscription_reminder" | "account_activation") => {
    const emailLabels = {
      payment_due: "Rappel de paiement",
      subscription_reminder: "Rappel d'abonnement",
      account_activation: "Activation de compte"
    };
    try {
      const result = await apiSendSubscriptionReminder(school.id, type);
      if (result.success) {
        showApiSuccessToast(emailLabels[type], result.message);
      } else {
        showApiErrorToast(new Error(result.message), emailLabels[type]);
      }
    } catch (err) {
      showApiErrorToast(err, emailLabels[type]);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.adminEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        return <Badge variant="destructive">Expiré</Badge>;
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

  if (errorDetails) {
    return <ErrorState onRetry={loadSchools} />;
  }

  return (
    <ContentTransition isLoading={loading} skeleton={<SchoolsSkeleton />}>
      <div className="space-y-6">
        <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestion des écoles</h1>
            <p className="text-muted-foreground">
              {schools.length} écoles enregistrées sur la plateforme
            </p>
          </div>
        </FadeIn>

        {schools.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptySchools onRetry={loadSchools} />
            </CardContent>
          </Card>
        ) : (
          <>
            <FadeIn delay={50}>
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une école..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={100}>
              <Card>
                <CardHeader>
                  <CardTitle>Liste des écoles</CardTitle>
                  <CardDescription>Gérez les écoles et leurs abonnements</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>École</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead className="text-center">Élèves</TableHead>
                        <TableHead className="text-center">Profs</TableHead>
                        <TableHead>Abonnement</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchools.length === 0 && searchQuery ? (
                        <EmptySearchResults query={searchQuery} onReset={() => setSearchQuery("")} />
                      ) : (
                        filteredSchools.map((school, index) => (
                          <TableRow 
                            key={school.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <School className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{school.name}</p>
                                  <p className="text-xs text-muted-foreground">{school.code}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{school.city}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{school.adminName}</p>
                                <p className="text-xs text-muted-foreground">{school.adminEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{school.studentCount}</TableCell>
                            <TableCell className="text-center font-medium">{school.teacherCount}</TableCell>
                            <TableCell>{getSubscriptionBadge(school)}</TableCell>
                            <TableCell>
                              <Badge variant={school.status === "active" ? "default" : "secondary"}>
                                {school.status === "active" ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    navigate(`/superadmin/schools/${school.id}`);
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendEmail(school, "subscription_reminder")}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Envoyer rappel
                                  </DropdownMenuItem>
                                  {school.subscription.status === "expired" && (
                                    <DropdownMenuItem onClick={() => handleSendEmail(school, "payment_due")}>
                                      <Mail className="mr-2 h-4 w-4 text-destructive" />
                                      Rappel de paiement
                                    </DropdownMenuItem>
                                  )}
                                  {school.subscription.status === "pending_activation" && (
                                    <DropdownMenuItem onClick={() => handleSendEmail(school, "account_activation")}>
                                      <Mail className="mr-2 h-4 w-4 text-primary" />
                                      Demande d'activation
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleToggleStatus(school)}>
                                    <Power className="mr-2 h-4 w-4" />
                                    {school.status === "active" ? "Désactiver" : "Activer"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </FadeIn>
          </>
        )}

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSchool?.name}</DialogTitle>
              <DialogDescription>Détails de l'école et de son abonnement</DialogDescription>
            </DialogHeader>
            {selectedSchool && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Code</p>
                    <p className="font-medium">{selectedSchool.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedSchool.types}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ville</p>
                    <p className="font-medium">{selectedSchool.city}, {selectedSchool.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selectedSchool.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedSchool.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedSchool.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <GraduationCap className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedSchool.studentCount}</p>
                      <p className="text-xs text-muted-foreground">Élèves</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedSchool.teacherCount}</p>
                      <p className="text-xs text-muted-foreground">Enseignants</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedSchool.classCount}</p>
                      <p className="text-xs text-muted-foreground">Classes</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Abonnement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-medium capitalize">{selectedSchool.subscription.plan}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Statut</p>
                        {selectedSchool && getSubscriptionBadge(selectedSchool)}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date de début</p>
                        <p className="font-medium">
                          {new Date(selectedSchool.subscription.startDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date de fin</p>
                        <p className="font-medium">
                          {new Date(selectedSchool.subscription.endDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Montant</p>
                        <p className="font-medium">
                          {new Intl.NumberFormat('fr-CD', { 
                            style: 'currency', 
                            currency: selectedSchool.subscription.currency,
                            maximumFractionDigits: 0 
                          }).format(selectedSchool.subscription.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Renouvellement auto</p>
                        <p className="font-medium">
                          {selectedSchool.subscription.autoRenew ? "Oui" : "Non"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Fermer
              </Button>
              {selectedSchool && selectedSchool.subscription.status !== "active" && (
                <Button onClick={() => {
                  handleSendEmail(
                    selectedSchool, 
                    selectedSchool.subscription.status === "expired" ? "payment_due" : "account_activation"
                  );
                }}>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer rappel
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContentTransition>
  );
}
