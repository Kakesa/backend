import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Mail,
  RefreshCw,
  Plus,
  Building2,
  Inbox,
  WifiOff,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SchoolWithStats, SubscriptionStatus } from "@/types/superadmin.types";
import { 
  apiGetAllSchoolsWithStats,
  apiSendSubscriptionReminder,
  apiUpdateSchoolSubscription
} from "@/services/api/superadmin.api";
import { useNavigate } from "react-router-dom";
import { showApiErrorToast, showApiSuccessToast, getApiErrorDetails, type ApiErrorDetails } from "@/lib/apiErrorHandler";

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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
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

// Skeleton pour le chargement
function SubscriptionsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Stats Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table header skeleton */}
            <div className="grid grid-cols-7 gap-4 pb-4 border-b">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            {/* Table rows skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4 py-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-6 w-14" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuperAdminSubscriptions() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithStats | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const data = await apiGetAllSchoolsWithStats();
      setSchools(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement écoles:", error);
      showApiErrorToast(error, "Chargement abonnements");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (school: SchoolWithStats, type: "payment_due" | "subscription_reminder" | "account_activation") => {
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
    } catch (error) {
      showApiErrorToast(error, emailLabels[type]);
    }
  };

  const handleActivateSubscription = async (school: SchoolWithStats) => {
    try {
      await apiUpdateSchoolSubscription(school.id, { status: "active" });
      await loadSchools();
      showApiSuccessToast("Abonnement activé", `L'abonnement de ${school.name} a été activé avec succès`);
    } catch (error) {
      showApiErrorToast(error, "Activation abonnement");
    }
  };

  const openEmailDialog = (school: SchoolWithStats) => {
    setSelectedSchool(school);
    
    // Préparer le contenu de l'email selon le statut
    if (school.subscription.status === "expired") {
      setEmailSubject("Rappel de paiement - Abonnement EducManage expiré");
      setEmailBody(`Cher(e) ${school.adminName},

Nous vous informons que l'abonnement de votre établissement "${school.name}" a expiré le ${new Date(school.subscription.endDate).toLocaleDateString("fr-FR")}.

Pour continuer à utiliser nos services sans interruption, veuillez procéder au renouvellement de votre abonnement.

Montant: ${formatCurrency(school.subscription?.amount || 0, school.subscription?.currency || "CDF")}
Plan: ${(school.subscription?.plan || "basic").toUpperCase()}

Cordialement,
L'équipe EducManage`);
    } else if (school.subscription.status === "pending_activation") {
      setEmailSubject("Activation de compte - EducManage");
      setEmailBody(`Cher(e) ${school.adminName},

Merci d'avoir choisi EducManage pour la gestion de votre établissement "${school.name}".

Votre compte est en attente d'activation. Pour activer votre abonnement et commencer à utiliser nos services, veuillez effectuer le paiement initial.

Plan choisi: ${school.subscription.plan.toUpperCase()}
Montant: ${formatCurrency(school.subscription?.amount || 0, school.subscription?.currency || "CDF")}

Cordialement,
L'équipe EducManage`);
    } else if (school.subscription.status === "trial") {
      setEmailSubject("Fin de période d'essai - EducManage");
      setEmailBody(`Cher(e) ${school.adminName},

Votre période d'essai pour "${school.name}" se termine le ${school.subscription?.endDate ? new Date(school.subscription.endDate).toLocaleDateString("fr-FR") : "N/A"}.

Pour continuer à utiliser EducManage, veuillez souscrire à un abonnement avant cette date.

Nous proposons plusieurs plans adaptés à vos besoins.

Cordialement,
L'équipe EducManage`);
    }
    
    setShowEmailDialog(true);
  };

  const handleSendCustomEmail = async () => {
    if (!selectedSchool) return;
    
    setSendingEmail(true);
    try {
      // Simuler l'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 1000));
      showApiSuccessToast("Email envoyé", `Email envoyé avec succès à ${selectedSchool.adminEmail}`);
      setShowEmailDialog(false);
      setEmailSubject("");
      setEmailBody("");
    } catch (error) {
      showApiErrorToast(error, "Envoi email");
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredSchools = Array.isArray(schools) 
    ? (statusFilter === "all" 
        ? schools 
        : schools.filter(s => s.subscription?.status === statusFilter))
    : [];

  const getStatusIcon = (status: SubscriptionStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "pending_activation":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "trial":
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary">Actif</Badge>;
      case "expired":
        return <Badge variant="destructive">Expiré</Badge>;
      case "pending_activation":
        return <Badge variant="secondary">En attente</Badge>;
      case "trial":
        return <Badge variant="outline">Essai</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('fr-CD', { 
        style: 'currency', 
        currency: currency || 'USD',
        maximumFractionDigits: 0 
      }).format(amount || 0);
    } catch (e) {
      return `${amount || 0} ${currency || 'USD'}`;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return 0;
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return <SubscriptionsSkeleton />;
  }

  // État d'erreur
  const hasError = !loading && schools.length === 0;

  // État vide - aucune école
  if (schools.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestion des abonnements</h1>
            <p className="text-muted-foreground">
              Suivez et gérez les abonnements de toutes les écoles
            </p>
          </div>
          <Button onClick={loadSchools} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Empty State */}
        <Card className="border-dashed border-2">
          <EmptyState
            icon={Building2}
            title="Aucun abonnement à gérer"
            description="Il n'y a pas encore d'écoles enregistrées sur la plateforme. Ajoutez des écoles pour commencer à gérer leurs abonnements."
            action={{
              label: "Voir les écoles",
              onClick: () => navigate("/superadmin/schools")
            }}
          />
        </Card>
      </div>
    );
  }

  // Stats
  const stats = {
    active: Array.isArray(schools) ? schools.filter(s => s.subscription?.status === "active").length : 0,
    expired: Array.isArray(schools) ? schools.filter(s => s.subscription?.status === "expired").length : 0,
    pending: Array.isArray(schools) ? schools.filter(s => s.subscription?.status === "pending_activation").length : 0,
    trial: Array.isArray(schools) ? schools.filter(s => s.subscription?.status === "trial").length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des abonnements</h1>
          <p className="text-muted-foreground">
            Suivez et gérez les abonnements de toutes les écoles
          </p>
        </div>
        <Button onClick={loadSchools} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === "active" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === "expired" ? "ring-2 ring-destructive" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "expired" ? "all" : "expired")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expirés</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === "pending_activation" ? "ring-2 ring-muted-foreground" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "pending_activation" ? "all" : "pending_activation")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === "trial" ? "ring-2 ring-muted-foreground" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "trial" ? "all" : "trial")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Période d'essai</p>
                <p className="text-2xl font-bold">{stats.trial}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Abonnements</CardTitle>
            <CardDescription>
              {filteredSchools.length} abonnement(s) {statusFilter !== "all" && `(filtre: ${statusFilter})`}
            </CardDescription>
          </div>
          {statusFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
              Effacer filtre
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>École</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Jours restants</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-muted/50 p-4 rounded-full mb-4">
                        <Inbox className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Aucun abonnement trouvé pour ce filtre
                      </p>
                      <Button 
                        variant="link" 
                        onClick={() => setStatusFilter("all")}
                        className="text-primary"
                      >
                        Afficher tous les abonnements
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchools.map((school) => {
                  const daysRemaining = school.subscription ? getDaysRemaining(school.subscription.endDate) : 0;
                  return (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-xs text-muted-foreground">{school.adminEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {school.subscription?.plan || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {school.subscription ? (
                            <>
                              {getStatusIcon(school.subscription.status)}
                              {getStatusBadge(school.subscription.status)}
                            </>
                          ) : (
                            <Badge variant="secondary">Aucun</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {school.subscription ? new Date(school.subscription.endDate).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                      <TableCell>
                        {school.subscription ? (
                          <span className={`font-medium ${
                            daysRemaining < 0 ? "text-destructive" :
                            daysRemaining < 7 ? "text-destructive" :
                            daysRemaining < 30 ? "text-yellow-600" :
                            "text-primary"
                          }`}>
                            {daysRemaining < 0 
                              ? `${Math.abs(daysRemaining)} jours de retard`
                              : `${daysRemaining} jours`
                            }
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {school.subscription ? formatCurrency(school.subscription.amount, school.subscription.currency) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {school.subscription?.status === "pending_activation" && (
                            <Button 
                              size="sm" 
                              onClick={() => handleActivateSubscription(school)}
                            >
                              Activer
                            </Button>
                          ) || (
                            !school.subscription && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/superadmin/schools/${school.id}`)}
                              >
                                Configurer
                              </Button>
                            )
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={!school.subscription}
                            onClick={() => openEmailDialog(school)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer un email</DialogTitle>
            <DialogDescription>
              Envoyer un email à {selectedSchool?.adminName} ({selectedSchool?.adminEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Sujet de l'email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Contenu de l'email"
                rows={12}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendCustomEmail} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
