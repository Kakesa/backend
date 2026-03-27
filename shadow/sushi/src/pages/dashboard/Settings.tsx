/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MobileMoneyPaymentForm } from "@/components/payments/MobileMoneyPaymentForm";
import { JoinedUsersHistory } from "@/components/settings/JoinedUsersHistory";
import { Settings as SettingsIcon, CreditCard, Calendar, CheckCircle, AlertCircle, Loader2, Copy, Check, RefreshCw, Users, Camera, User, AlertTriangle } from "lucide-react";
import { apiGetCurrentSchoolSubscription } from "@/services/api/superadmin.api";
import { apiGetCurrentSchool, apiGetSchoolCode, apiRegenerateSchoolCode, apiUpdateSchool, apiUpdateTermSystem } from "@/services/api/schools.api";
import type { SchoolSubscription } from "@/types/superadmin.types";
import type { School, UpdateSchoolDTO, TermSystem } from "@/types/school.types";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ProfilePhotoUpload } from "@/components/ui/profile-photo-upload";
import { useAuth } from "@/contexts/AuthContext";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [termSystem, setTermSystem] = useState<TermSystem>("trimester");
  const [showTermSystemWarning, setShowTermSystemWarning] = useState(false);

  // Form states for school info
  const [schoolData, setSchoolData] = useState<UpdateSchoolDTO>({
    name: "",
    address: "",
    phone: "",
    email: "",
    academicYear: "",
  });

  // Charger les données d'abonnement et le code école depuis l'API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subscriptionData, codeData, schoolInfo] = await Promise.all([
          apiGetCurrentSchoolSubscription().catch(() => null),
          apiGetSchoolCode().catch(() => null),
          apiGetCurrentSchool().catch(() => null),
        ]);
        
        if (subscriptionData) {
          setSubscription(subscriptionData);
        } else {
          // Fallback avec données simulées si l'API échoue
          setSubscription({
            schoolId: "current",
            plan: "standard",
            status: "active",
            startDate: "2024-01-01",
            endDate: "2025-06-30",
            amount: 150000,
            currency: "XOF",
            autoRenew: false,
          });
        }
        
        if (codeData) {
          setSchoolCode(codeData.code);
        }

        if (schoolInfo) {
          setSchool(schoolInfo);
          setTermSystem(schoolInfo.settings?.termSystem || "trimester");
          setSchoolData({
            name: schoolInfo.name || "",
            address: schoolInfo.address || "",
            phone: schoolInfo.phone || "",
            email: schoolInfo.email || "",
            academicYear: schoolInfo.academicYear || "2024-2025",
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Profile photo management
  const {
    isUploading,
    isDeleting,
    error: photoError,
    uploadPhoto,
    removePhoto,
    clearError
  } = useProfilePhoto({
    userType: 'user',
    userId: user?.id || '', // Utiliser l'ID user principal
    currentPhoto: user?.avatarUrl
  });

  const handlePhotoUpdate = (photoUrl: string) => {
    setIsEditingPhoto(false);
    toast({
      title: "Photo mise à jour",
      description: "Votre photo de profil a été mise à jour avec succès.",
    });
  };

  const handlePhotoError = (errorMessage: string) => {
    console.error('Photo upload error:', errorMessage);
    clearError();
    toast({
      title: "Erreur",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleSave = async () => {
    if (!school?.id) return;
    
    setSaving(true);
    try {
      // Inclure le système de termes dans les données à sauvegarder
      const updatedSchoolData = {
        ...schoolData,
        settings: {
          ...school?.settings,
          termSystem: termSystem,
          trimesters: termSystem === "trimester" ? 3 : 2
        }
      };
      
      await apiUpdateSchool(school.id, updatedSchoolData);
      
      // Mettre à jour l'état local de l'école
      setSchool({
        ...school,
        settings: {
          ...school.settings,
          termSystem: termSystem,
          trimesters: termSystem === "trimester" ? 3 : 2
        }
      });
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les informations de l'établissement ont été mises à jour.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTermSystemChange = (newTermSystem: TermSystem) => {
    if (school?.settings?.termSystem && newTermSystem !== school.settings.termSystem) {
      setShowTermSystemWarning(true);
    } else {
      setTermSystem(newTermSystem);
    }
  };

  const confirmTermSystemChange = async () => {
    if (!school?.id) return;
    
    setSaving(true);
    try {
      const result = await apiUpdateTermSystem(termSystem);
      
      // Mettre à jour l'état local de l'école
      setSchool({
        ...school,
        settings: {
          ...school.settings,
          termSystem: result.termSystem,
          trimesters: result.trimesters
        }
      });
      
      setShowTermSystemWarning(false);
      
      toast({
        title: "Système de termes mis à jour",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le système de termes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentComplete = async (payment: { transactionId?: string }) => {
    toast({
      title: "Abonnement renouvelé !",
      description: `Transaction ${payment.transactionId} confirmée.`,
    });
    // Recharger les données d'abonnement
    try {
      const data = await apiGetCurrentSchoolSubscription();
      setSubscription(data);
    } catch (error) {
      console.error("Erreur lors du rechargement:", error);
    }
  };

  const copySchoolCode = async () => {
    if (schoolCode) {
      await navigator.clipboard.writeText(schoolCode);
      setCopied(true);
      toast({ title: "Copié", description: "Le code école a été copié dans le presse-papier" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    try {
      const result = await apiRegenerateSchoolCode();
      setSchoolCode(result.code);
      toast({
        title: "Code régénéré",
        description: "Un nouveau code a été généré. L'ancien code n'est plus valide.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de régénérer le code",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const daysRemaining = subscription 
    ? Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Actif
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Expiré
          </Badge>
        );
      case "pending_activation":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            En attente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérez les paramètres de votre établissement</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Abonnement
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Photo de profil */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photo de profil
                  </CardTitle>
                  <CardDescription>
                    Cliquez sur la photo pour la modifier
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <ProfileAvatar
                    src={user?.avatarUrl}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    userType="user"
                    userId={user?.id}
                    size="xl"
                    editable={true}
                    onEdit={() => setIsEditingPhoto(true)}
                  />
                  
                  <Badge className="bg-blue-500">
                    Administrateur
                  </Badge>
                </CardContent>
              </Card>

              {/* Upload de photo */}
              {isEditingPhoto && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Modifier la photo</CardTitle>
                    <CardDescription>
                      Téléchargez une nouvelle photo de profil
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfilePhotoUpload
                      currentPhoto={user?.avatarUrl}
                      userType="user"
                      userId={user?.id || ''}
                      userName={`${user?.firstName} ${user?.lastName}`}
                      onSuccess={handlePhotoUpdate}
                      onError={handlePhotoError}
                    />
                    
                    {photoError && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">{photoError}</p>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingPhoto(false)}
                        disabled={isUploading}
                      >
                        Annuler
                      </Button>
                      {user?.avatarUrl && (
                        <Button 
                          variant="destructive" 
                          onClick={removePhoto}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Informations du profil */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Détails de votre compte administrateur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nom complet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Prénom</Label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="font-medium">{user?.firstName || 'Non renseigné'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="font-medium">{user?.lastName || 'Non renseigné'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>

                  {/* Rôle et statut */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Rôle</Label>
                      <div className="mt-1">
                        <Badge className="bg-blue-500">
                          Administrateur
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Statut du compte</Label>
                      <div className="mt-1">
                        <Badge className={user?.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {user?.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Date de création */}
                  {user?.createdAt && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Membre depuis</Label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dernière connexion */}
                  {user?.lastLogin && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Dernière connexion</Label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="font-medium">
                          {new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6">
            {/* School Code Management */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Code d'invitation
                </CardTitle>
                <CardDescription>
                  Partagez ce code avec les enseignants, élèves et parents pour qu'ils rejoignent votre école
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {schoolCode ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-background border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Code de l'école (Public)</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-mono font-bold tracking-widest">{schoolCode}</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={copySchoolCode}>
                              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        Ce code permet de rejoindre l'établissement. Régénérer le code invalidera l'ancien.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateCode}
                        disabled={regenerating}
                      >
                        {regenerating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Régénérer
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Code école non disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Joined Users History */}
            <JoinedUsersHistory />

            {/* School Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'établissement</CardTitle>
                <CardDescription>
                  Modifiez les informations générales de votre école
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">Nom de l'établissement</Label>
                    <Input 
                      id="schoolName" 
                      value={schoolData.name} 
                      onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internalCode">Code interne (ID)</Label>
                    <Input id="internalCode" value={school?.code || ""} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input 
                    id="address" 
                    value={schoolData.address} 
                    onChange={(e) => setSchoolData({...schoolData, address: e.target.value})}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      value={schoolData.phone} 
                      onChange={(e) => setSchoolData({...schoolData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={schoolData.email} 
                      onChange={(e) => setSchoolData({...schoolData, email: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres académiques</CardTitle>
                <CardDescription>
                  Configurez l'année scolaire et les évaluations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="termSystem">Terme du système</Label>
                  <Select value={termSystem} onValueChange={handleTermSystemChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le système" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trimester">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Trimestre (3 termes)</p>
                            <p className="text-xs text-muted-foreground">Adapté aux écoles primaires</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="semester">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Semestre (2 termes)</p>
                            <p className="text-xs text-muted-foreground">Adapté aux écoles secondaires</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce choix s'applique globalement à tout l'établissement et détermine le type de bulletin utilisé.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Année scolaire</Label>
                    <Input 
                      id="academicYear" 
                      value={schoolData.academicYear} 
                      onChange={(e) => setSchoolData({...schoolData, academicYear: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trimestres">Nombre de périodes</Label>
                    <Input 
                      id="trimestres" 
                      type="number" 
                      value={termSystem === "trimester" ? 3 : 2} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Moyenne de passage</p>
                    <p className="text-sm text-muted-foreground">Note minimale pour passer en classe supérieure</p>
                  </div>
                  <Input className="w-20" type="number" defaultValue="10" min={0} max={20} />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Gérez vos préférences de notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertes d'absence</p>
                    <p className="text-sm text-muted-foreground">Notifier les parents en cas d'absence</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels de bulletins</p>
                    <p className="text-sm text-muted-foreground">Rappel avant la fin du trimestre</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>
                  Paramètres de sécurité et d'accès
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-muted-foreground">Ajouter une couche de sécurité supplémentaire</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sessions actives</p>
                    <p className="text-sm text-muted-foreground">Déconnecter toutes les autres sessions</p>
                  </div>
                  <Button variant="outline" size="sm">Déconnecter</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} size="lg" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder les modifications
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current subscription status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Votre abonnement
                </CardTitle>
                <CardDescription>
                  État actuel de votre abonnement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <Badge className="bg-primary/10 text-primary">
                        {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Statut</span>
                      {getStatusBadge(subscription.status)}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expire le</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(subscription.endDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Jours restants</span>
                      <span className={`font-bold ${daysRemaining < 30 ? "text-amber-600" : "text-foreground"}`}>
                        {daysRemaining} jours
                      </span>
                    </div>
                    {daysRemaining < 30 && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          ⚠️ Votre abonnement expire bientôt. Renouvelez maintenant pour éviter toute interruption de service.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment form */}
            {subscription && (
              <MobileMoneyPaymentForm
                subscriptionPlan={subscription.plan}
                amount={subscription.amount}
                currency={subscription.currency}
                onPaymentComplete={handlePaymentComplete}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogue d'avertissement pour changement de système de termes */}
      {showTermSystemWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold">Changement de système de termes</h3>
            </div>
            
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous êtes sur le point de changer le système de termes de votre établissement. 
                Ce changement affectera:
              </AlertDescription>
            </Alert>
            
            <ul className="space-y-2 mb-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Le type de bulletin utilisé dans tout l'établissement
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Les calculs de moyennes et de progressions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                L'interface de saisie des notes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Les rapports et exportations
              </li>
            </ul>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Recommandation:</strong> Assurez-vous d'avoir des sauvegardes 
                des données actuelles avant de procéder à ce changement.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowTermSystemWarning(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button 
                onClick={confirmTermSystemChange}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    Confirmer le changement
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
