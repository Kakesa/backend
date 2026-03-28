/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword } from "@/lib/passwordValidation";

import { User as UserIcon, Bell, Lock, Baby, Camera, Calendar } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ProfilePhotoUpload } from "@/components/ui/profile-photo-upload";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { Badge } from "@/components/ui/badge";

export default function ParentSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const parent = (user as any)?.linkedProfile || user;
  const children = (user as any)?.children || (user as any)?.linkedProfile?.children || [];

  // Profile photo management
  const {
    isUploading,
    isDeleting,
    error: photoError,
    uploadPhoto,
    removePhoto,
    clearError
  } = useProfilePhoto({
    userType: 'parent',
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

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos préférences ont été mises à jour.",
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
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos préférences et informations</p>
      </div>

      {/* Photo de profil */}
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
            userType="parent"
            userId={user?.linkedId}
            size="xl"
            editable={true}
            onEdit={() => setIsEditingPhoto(true)}
          />
          
          <Badge className="bg-purple-500">
            Parent
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
              userType="parent"
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
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Vos informations de contact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" defaultValue={parent?.firstName || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" defaultValue={parent?.lastName || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={parent?.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" defaultValue={parent?.phone || ""} placeholder="+225 XX XX XX XX" />
            </div>
          </div>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </CardContent>
      </Card>

      {/* Children Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Enfants rattachés
          </CardTitle>
          <CardDescription>Liste de vos enfants inscrits dans l'établissement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {children.length > 0 ? (
              children.map((child: any) => (
                <div key={child.id || child._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {child.firstName?.[0]}{child.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">{child.firstName} {child.lastName}</p>
                      <p className="text-sm text-muted-foreground">{child.matricule} - {child.className || child.class?.name || "Classe non définie"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic text-sm">Aucun enfant rattaché à ce compte.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Gérez vos préférences de notification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nouvelles notes</p>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification quand une nouvelle note est publiée
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Absences</p>
              <p className="text-sm text-muted-foreground">
                Être alerté en cas d'absence de votre enfant
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Messages des professeurs</p>
              <p className="text-sm text-muted-foreground">
                Recevoir les messages des enseignants
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Événements scolaires</p>
              <p className="text-sm text-muted-foreground">
                Notifications sur les événements de l'école
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
          <CardDescription>Modifiez votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <PasswordInput id="currentPassword" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <PasswordInput 
              id="newPassword" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showValidation 
              showStrength 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <PasswordInput 
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleChangePassword}>Changer le mot de passe</Button>
        </CardContent>
      </Card>
    </div>
  );
}
