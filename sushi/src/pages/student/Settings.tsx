/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PasswordInput } from "@/components/ui/password-input";
import { User, Bell, Lock, Camera, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword } from "@/lib/passwordValidation";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ProfilePhotoUpload } from "@/components/ui/profile-photo-upload";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { Badge } from "@/components/ui/badge";

export default function StudentSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const student = (user as any)?.linkedProfile || user;
  const studentClass = (user as any)?.class || (user as any)?.linkedProfile?.class;

  // Profile photo management
  const {
    isUploading,
    isDeleting,
    error: photoError,
    uploadPhoto,
    removePhoto,
    clearError
  } = useProfilePhoto({
    userType: 'student',
    userId: user?.id || '', // Utiliser l'ID user principal au lieu de linkedId
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

  const handleChangePassword = () => {
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast({
        title: "Mot de passe invalide",
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été changé avec succès.",
    });
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile Card */}
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
            userType="student"
            userId={user?.linkedId}
            size="xl"
            editable={true}
            onEdit={() => setIsEditingPhoto(true)}
          />
          
          <Badge className="bg-blue-500">
            Étudiant
          </Badge>
        </CardContent>
      </Card>

      {/* Upload de photo */}
      {isEditingPhoto && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier la photo</CardTitle>
            <CardDescription>
              Téléchargez une nouvelle photo de profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilePhotoUpload
              currentPhoto={user?.avatarUrl}
              userType="student"
              userId={user?.linkedId || ''}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
          <CardDescription>Vos informations de profil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <ProfileAvatar
              src={user?.avatarUrl}
              alt={`${user?.firstName} ${user?.lastName}`}
              userType="student"
              userId={user?.linkedId}
              size="lg"
              showStatus={true}
              status="online"
            />
            <div>
              <h3 className="text-xl font-semibold">{student?.firstName} {student?.lastName}</h3>
              <p className="text-muted-foreground">{student?.matricule}</p>
              <p className="text-sm text-muted-foreground">{studentClass?.name || "Classe non définie"} - {studentClass?.academicYear || ""}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={student?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={student?.phone || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <Input value={student?.dateOfBirth || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={student?.address || ""} disabled />
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Pour modifier vos informations personnelles, veuillez contacter l'administration.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Gérez vos préférences de notification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nouvelles notes</p>
              <p className="text-sm text-muted-foreground">Recevoir une notification pour chaque nouvelle note</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rappels de cours</p>
              <p className="text-sm text-muted-foreground">Recevoir un rappel avant chaque cours</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Absences</p>
              <p className="text-sm text-muted-foreground">Être notifié en cas d'absence enregistrée</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>Gérez votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mot de passe actuel</Label>
              <PasswordInput placeholder="••••••••" />
            </div>
            <div></div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <PasswordInput 
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                showValidation 
                showStrength 
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmer le mot de passe</Label>
              <PasswordInput 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleChangePassword}>Modifier le mot de passe</Button>
        </CardContent>
      </Card>

      {/* Parent Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Parent/Tuteur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom du parent</Label>
              <Input value={student?.parentName || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Téléphone du parent</Label>
              <Input value={student?.parentPhone || ""} disabled />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
